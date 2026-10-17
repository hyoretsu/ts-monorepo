import Elysia, { t } from "elysia";
import { auth } from "@/shared/infra/betterAuth";
import { cache } from "@/shared/infra/cache";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
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
		({ body, prisma, userId }) =>
			new CreateExample(createPrismaUnitOfWork(prisma)).execute({ ...body, userId }),
		{ body: CreateExampleBody, response: { 200: CreateExampleReturn, 401: t.Object({ error: t.String() }) } },
	)
	.get(
		"/",
		async ({ query, userId, prisma, status }) => {
			const limit = query.limit ?? 20;
			if (query.cursor && !(await prisma.example.findFirst({ where: { id: query.cursor, userId } })))
				return status(400, { error: "INVALID_CURSOR" });
			return cache.read(`examples:${userId}`, JSON.stringify(query), async () => {
				const rows = await prisma.example.findMany({
					orderBy: [{ createdAt: "desc" }, { id: "desc" }],
					take: limit + 1,
					where: { userId },
					...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
				});
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
