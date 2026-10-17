import { t } from "elysia";
export const CreateExampleBody = t.Object({ name: t.String({ minLength: 1, pattern: "\\S" }) });
export type CreateExampleBody = typeof CreateExampleBody.static;
