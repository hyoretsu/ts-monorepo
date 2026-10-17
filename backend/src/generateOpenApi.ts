import path from "node:path";
import { exit } from "node:process";
import { server } from "./server";
import { docsPath } from "./shared/infra/elysia/openapi";

await server.modules;
server.compile();

const schema = await (await server.handle(new Request(`http://localhost${docsPath}/json`))).json();

await Bun.file(path.resolve(__dirname, "../out/openapi.json")).write(JSON.stringify(schema, null, 4));

exit(0);
