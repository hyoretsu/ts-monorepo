import Elysia, { t } from "elysia";
import { auth } from "@/shared/infra/betterAuth";
import { cache } from "@/shared/infra/cache";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { and, or } from "@/shared/infra/sql";
import { createPrismaUnitOfWork } from "@/shared/repositories/prisma";
import { CreateExampleBody, CreateExampleReturn } from "../../dtos/CreateExample";
import { CreateExample } from "../../useCases/CreateExample";
export const ExampleController = new Elysia({ detail: { tags: ["Example"] }, prefix: "/example" })
	.use(GlobalPlugin)
	.resolve(async ({ request, status }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) return status(401, { error: "UNAUTHENTICATED" });
		return { userId: session.user.id };
	})
	.post(
		"/",
		async ({ body, db, userId }) =>
			new CreateExample(createPrismaUnitOfWork(db)).execute({ ...body, userId }),
		{
			body: CreateExampleBody,
			response: { 200: CreateExampleReturn, 401: t.Object({ error: t.String() }) },
		},
	)
	.get(
		"/",
		async ({ query, userId, db, status }) => {
			const limit = query.limit ?? 20;
			const cursor = query.cursor
				? await db.orm.public.Example.where({ id: query.cursor, userId }).first()
				: null;
			if (query.cursor && !cursor) return status(400, { error: "INVALID_CURSOR" });
			return cache.read(`examples:${userId}`, JSON.stringify(query), async () => {
				let collection = db.orm.public.Example.where({ userId }).orderBy([
					row => row.createdAt.desc(),
					row => row.id.desc(),
				]);
				if (cursor)
					collection = collection.where(row =>
						or(
							row.createdAt.lt(cursor.createdAt),
							and(row.createdAt.eq(cursor.createdAt), row.id.lt(cursor.id)),
						),
					);
				const rows = await collection.limit(limit + 1).all();
				const items = rows.slice(0, limit).map(row => ({
					createdAt: row.createdAt.toISOString(),
					id: row.id,
					name: row.name,
					processedAt: row.processedAt?.toISOString() ?? null,
				}));
				return { items, nextCursor: rows.length > limit ? items.at(-1)!.id : null };
			});
		},
		{
			query: t.Object({
				cursor: t.Optional(t.String()),
				limit: t.Optional(t.Integer({ maximum: 100, minimum: 1 })),
			}),
			response: {
				200: t.Object({ items: t.Array(CreateExampleReturn), nextCursor: t.Nullable(t.String()) }),
				400: t.Object({ error: t.String() }),
				401: t.Object({ error: t.String() }),
			},
		},
	);
