import { afterAll, expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { t, type TSchema } from "elysia";
import { generateTypebox } from "../scripts/generate-typebox";

const root = resolve(import.meta.dir, "..");
const output = await mkdtemp(resolve(root, ".typebox-equivalence-"));
afterAll(() => rm(output, { force: true, recursive: true }));

// This is an equivalence oracle for the checked-in legacy schemas, not a second
// production generator. It intentionally covers only their current field types.
const legacyScalars = {
	Boolean: () => t.Boolean(),
	DateTime: () => t.Date(),
	Int: () => t.Integer(),
	Json: () => t.Any(),
	String: () => t.String(),
};

test("real Prisma 8 emission preserves legacy Prismabox Plain validation", async () => {
	const contractPath = resolve(root, "out/prisma/contract.json");
	// Emission must run first; do not substitute a fabricated contract fixture.
	expect(await Bun.file(contractPath).exists()).toBe(true);
	await generateTypebox(contractPath, output);
	let checked = 0;
	for (const file of await readdir(resolve(root, "src/models"))) {
		if (!file.endsWith(".prisma")) continue;
		const source = await Bun.file(resolve(root, "src/models", file)).text();
		for (const match of source.matchAll(/model\s+(\w+)\s*\{([^}]+)\}/g)) {
			const [, name, body] = match;
			const properties: Record<string, TSchema> = {};
			for (const line of body.split("\n")) {
				const field = /^\s*(\w+)\s+(String|Boolean|Int|DateTime|Json)(\?)?(?:\s|$)/.exec(line);
				if (!field) continue;
				const [, fieldName, scalar, nullable] = field;
				const schema = legacyScalars[scalar as keyof typeof legacyScalars]();
				properties[fieldName] = nullable ? t.Union([t.Null(), schema]) : schema;
			}
			const generated = await import(resolve(output, `${name}Plain.ts`));
			const expected = t.Object(properties, { additionalProperties: true });
			const actual = JSON.parse(JSON.stringify(generated[`${name}Plain`]));
			actual.required.sort();
			expected.required?.sort();
			expect(actual).toEqual(JSON.parse(JSON.stringify(expected)));
			checked++;
		}
	}
	expect(checked).toBeGreaterThan(0);
	const barrel = await import(resolve(output, "barrel.ts"));
	expect(barrel.VariantPlain.properties.id.type).toBe("string");
	expect(barrel.VariantPlainInputCreate.required).toEqual(["name", "slug"]);
	expect(barrel.VariantPlainInputUpdate.required).toBeUndefined();
	expect(barrel.UserPlainInputCreate.required).toEqual(["email", "id", "name"]);
	expect(barrel.AccountPlainInputCreate.required).toEqual(["accountId", "id", "providerId", "userId"]);
});
