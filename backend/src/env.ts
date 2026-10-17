import path from "node:path";
import { Value } from "@sinclair/typebox/value";
import { t, type UnwrapSchema } from "elysia";
import { NodeEnv } from "@/shared/types";

const defaultPort = "3333";
const port = (process.env.PORT ?? defaultPort) as string;

const defaultApiUrl = `http://localhost:${port}`;
const apiUrl = (process.env.API_URL ?? defaultApiUrl) as string;

export const envSchema = t.Object({
	API_URL: t.String({
		default: defaultApiUrl,
		format: "uri",
	}),
	APP_URL: t.String({
		default: "http://localhost:3000",
		format: "uri",
	}),
	BETTER_AUTH_SECRETS: t.String({ default: "1:local-template-development-secret-change-before-production" }),
	BETTER_AUTH_URL: t.String({ default: `${apiUrl}` }),
	CORS_WHITELIST: t.String({ default: "*" }),
	DATABASE_TEST_URL: t.Optional(
		t.String({
			default: "postgresql://postgres:password@localhost:5432/template_test",
			format: "uri",
		}),
	),
	DATABASE_URL: t.String({
		default: "postgresql://postgres:password@localhost:5432/template",
		format: "uri",
	}),
	MAIL_DRIVER: t.Literal("nodemailer", { default: "nodemailer" }),
	MAIL_HOST: t.String({ default: "" }),
	MAIL_PASS: t.String({ default: "" }),
	MAIL_PORT: t.String({ default: "" }),
	MAIL_USER: t.String({ default: "" }),
	NODE_ENV: t.Optional(
		t.Enum(NodeEnv, {
			default: NodeEnv.Development,
		}),
	),
	PORT: t.Optional(t.Numeric({ default: defaultPort })),
	RABBITMQ_URL: t.String({ default: "amqp://guest:guest@127.0.0.1:5672" }),
	REDIS_URL: t.String({ default: "redis://127.0.0.1:6379" }),
	RESEND_API_KEY: t.Optional(t.String()),
	S3_ACCESS_KEY_ID: t.Optional(t.String()),
	S3_BUCKET: t.Optional(t.String()),
	S3_ENDPOINT: t.Optional(
		t.String({
			format: "uri",
		}),
	),
	S3_SECRET_ACCESS_KEY: t.Optional(t.String()),
	SERVICE_NAMESPACE: t.Optional(t.String()),
	STATIC_DIR: t.Optional(
		t.String({
			default: path.resolve(__dirname, "..", "static"),
		}),
	),
});

declare global {
	namespace NodeJS {
		interface ProcessEnv extends UnwrapSchema<typeof envSchema> {}
	}
}

Object.assign(process.env, Value.Default(envSchema, process.env));
