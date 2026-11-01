import "dotenv/config";
import { defineConfig as postgres } from "@prisma/orm-postgres/config";
import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({
	orm: postgres({
		contract: "./src/contract.prisma",
		db: { connection: process.env.DATABASE_URL },
		migrations: { dir: "./migrations" },
		output: "./out/prisma",
	}),
});
