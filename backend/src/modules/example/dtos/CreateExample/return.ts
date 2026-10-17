import { t } from "elysia";
export const CreateExampleReturn = t.Object({
	createdAt: t.String(),
	id: t.String(),
	name: t.String(),
	processedAt: t.Nullable(t.String()),
});
export type CreateExampleReturn = typeof CreateExampleReturn.static;
