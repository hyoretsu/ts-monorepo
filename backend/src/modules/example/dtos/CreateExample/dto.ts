import { t } from "elysia";
import { CreateExampleBody } from "./body";
export const CreateExampleDTO = t.Object({ ...CreateExampleBody.properties, userId: t.String() });
export type CreateExampleDTO = typeof CreateExampleDTO.static;
