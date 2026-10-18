import { Value } from "@sinclair/typebox/value";
import Elysia, { t } from "elysia";
import { auth } from "@/shared/infra/betterAuth";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { createPrismaUnitOfWork } from "@/shared/repositories/prisma";
import { CreateVariantBody, UpdateVariantBody, VariantError, VariantReturn } from "../../dtos";
import { ManageVariants } from "../../useCases/ManageVariants";

function duplicateSlug(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	if ("code" in error && (error.code === "23505" || error.code === "P2002")) return true;
	if ("originalCode" in error && error.originalCode === "23505") return true;
	if ("kind" in error && error.kind === "UniqueConstraintViolation") return true;
	return (
		("cause" in error && duplicateSlug(error.cause)) ||
		("meta" in error && duplicateSlug(error.meta)) ||
		("driverAdapterError" in error && duplicateSlug(error.driverAdapterError))
	);
}
const errors = {
	401: VariantError,
	403: VariantError,
	404: VariantError,
	409: VariantError,
	422: VariantError,
};
const params = t.Object({ id: t.String() });
function serialize<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
	return Value.Decode(VariantReturn, {
		...row,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	});
}
export const VariantController = new Elysia({ detail: { tags: ["Variants"] }, prefix: "/variants" })
	.use(GlobalPlugin)
	.onError(({ code, error, status }) => {
		if (code === "VALIDATION") return status(422, { error: "INVALID_VARIANT" });
		if (duplicateSlug(error)) return status(409, { error: "DUPLICATE_VARIANT_SLUG" });
	})
	.resolve(async ({ request, prisma, status }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) return status(401, { error: "UNAUTHENTICATED" });
		const user = await prisma.user.findUnique({ select: { role: true }, where: { id: session.user.id } });
		if (user?.role !== "admin") return status(403, { error: "FORBIDDEN" });
		return { variants: new ManageVariants(createPrismaUnitOfWork(prisma)) };
	})
	.get("/", async ({ variants }) => (await variants.list()).map(serialize), {
		response: { 200: t.Array(VariantReturn), ...errors },
	})
	.get(
		"/:id",
		async ({ params, variants, status }) => {
			const row = await variants.find(params.id);
			return row ? serialize(row) : status(404, { error: "VARIANT_NOT_FOUND" });
		},
		{ params, response: { 200: VariantReturn, ...errors } },
	)
	.post("/", async ({ body, variants }) => serialize(await variants.create(body)), {
		body: CreateVariantBody,
		response: { 200: VariantReturn, ...errors },
	})
	.patch(
		"/:id",
		async ({ body, params, variants, status }) => {
			const row = await variants.update(params.id, body);
			return row ? serialize(row) : status(404, { error: "VARIANT_NOT_FOUND" });
		},
		{ body: UpdateVariantBody, params, response: { 200: VariantReturn, ...errors } },
	)
	.delete(
		"/:id",
		async ({ params, variants, status }) => {
			const row = await variants.delete(params.id);
			return row ? { id: row.id } : status(404, { error: "VARIANT_NOT_FOUND" });
		},
		{ params, response: { 200: t.Object({ id: t.String() }), ...errors } },
	);
