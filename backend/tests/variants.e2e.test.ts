import "./setup";
import { afterAll, expect, test } from "bun:test";
import { resolveVariant } from "../../scripts/prepare-variant";
import { server } from "../src/server";
import { cache } from "../src/shared/infra/cache";
import { prisma } from "../src/shared/infra/sql";

await server.modules;
server.compile();
afterAll(async () => {
	await cache.close();
	await prisma.$disconnect();
});
async function request(path: string, method = "GET", body?: unknown, cookie = "") {
	return server.handle(
		new Request(`http://localhost:3333${path}`, {
			headers: { "Content-Type": "application/json", Cookie: cookie, Origin: "http://localhost:5173" },
			method,
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
		}),
	);
}
test("variant administration rejects self-promotion and enforces current administrator role", async () => {
	const email = `${crypto.randomUUID()}@example.com`;
	const signup = await request("/auth/sign-up/email", "POST", {
		email,
		name: "Variant operator",
		password: "local-test-password",
		role: "admin",
	});
	expect(signup.status).toBe(200);
	const cookie = signup.headers
		.getSetCookie()
		.map(value => value.split(";")[0])
		.join("; ");
	const user = await prisma.user.findUniqueOrThrow({ where: { email } });
	expect(user.role).toBe("user");
	expect((await request("/variants/")).status).toBe(401);
	expect((await request("/variants/", "GET", undefined, cookie)).status).toBe(403);
	await request("/auth/update-user", "POST", { role: "admin" }, cookie);
	expect((await prisma.user.findUniqueOrThrow({ where: { email } })).role).toBe("user");
	// Explicit local operator administration, never a public elevation API.
	await prisma.user.update({ data: { role: "admin" }, where: { id: user.id } });
	expect((await request("/variants/", "POST", { name: "Bad", slug: "Invalid Slug" }, cookie)).status).toBe(
		422,
	);
	expect(
		(
			await request(
				"/variants/",
				"POST",
				{ name: "Bad", siteUrl: "javascript:alert(1)", slug: "invalid-url" },
				cookie,
			)
		).status,
	).toBe(422);
	const body = {
		name: "Brand",
		slug: `brand-${crypto.randomUUID()}`,
		themeColors: { light: { primary: "#112233" } },
	};
	const response = await request("/variants/", "POST", body, cookie);
	expect(response.status).toBe(200);
	const created = await response.json();
	expect(created.slug).toBe(body.slug);
	expect((await resolveVariant(body.slug))?.name).toBe("Brand");
	await expect(resolveVariant(`missing-${crypto.randomUUID()}`)).rejects.toThrow("Unknown VARIANT");
	expect((await request("/variants/", "POST", body, cookie)).status).toBe(409);
	expect((await request(`/variants/${created.id}`, "GET", undefined, cookie)).status).toBe(200);
	const listing = await (await request("/variants/", "GET", undefined, cookie)).json();
	expect(listing.some((row: { id: string }) => row.id === created.id)).toBe(true);
	const changed = await request(
		`/variants/${created.id}`,
		"PATCH",
		{ footerText: null, name: "Changed", siteUrl: "https://example.com" },
		cookie,
	);
	expect(changed.status).toBe(200);
	expect((await changed.json()).name).toBe("Changed");
	expect((await request(`/variants/${created.id}`, "DELETE", undefined, cookie)).status).toBe(200);
	expect((await request(`/variants/${created.id}`, "GET", undefined, cookie)).status).toBe(404);
	expect((await request(`/variants/${created.id}`, "PATCH", { name: "Missing" }, cookie)).status).toBe(404);
	expect((await request(`/variants/${created.id}`, "DELETE", undefined, cookie)).status).toBe(404);
	await prisma.user.update({ data: { role: "user" }, where: { id: user.id } });
	expect((await request("/variants/", "GET", undefined, cookie)).status).toBe(403);
});
