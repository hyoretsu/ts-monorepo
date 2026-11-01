import { expect, test } from "bun:test";
import { resolve } from "node:path";
import {
	CreateVariantBody,
	UpdateVariantBody,
	VariantReturn,
} from "../../../backend/src/modules/variants/dtos";

const root = resolve(import.meta.dir, "../../..");

test("generated persistence contracts preserve refined HTTP schemas", () => {
	expect(CreateVariantBody.required).toEqual(["name", "slug"]);
	expect(UpdateVariantBody.required).toBeUndefined();
	expect(CreateVariantBody.additionalProperties).toBe(false);
	expect(CreateVariantBody.properties).not.toHaveProperty("id");
	expect(CreateVariantBody.properties).not.toHaveProperty("createdAt");
	expect(CreateVariantBody.properties.slug.pattern).toBe("^[a-z0-9]+(-[a-z0-9]+)*$");
	expect(VariantReturn.properties.id.type).toBe("string");
	expect(VariantReturn.properties.createdAt.type).toBe("string");
});

test("actual exported OpenAPI and Kubb SDK preserve typed Variant payloads", async () => {
	// Run backend export and frontend generate first; stale or missing artifacts
	// must not be replaced with synthetic endpoint fixtures.
	const openapi = await Bun.file(resolve(root, "backend/out/openapi.json")).json();
	const path = Object.keys(openapi.paths).find(path => /\/variants\/?$/.test(path));
	expect(path).toBeDefined();
	const operation = openapi.paths[path!].post;
	const response = operation.responses["200"].content["application/json"].schema;
	const body = operation.requestBody.content["application/json"].schema;
	expect(response.properties.id.type).toBe("string");
	expect(response.properties.createdAt.type).toBe("string");
	expect(body.required).toEqual(["name", "slug"]);
	expect(body.properties).not.toHaveProperty("id");
	const sdk = await Bun.file(
		resolve(root, "frontend/src/lib/api/generated/api/types/PostVariants.ts"),
	).text();
	expect(sdk).toContain("export type PostVariants200 = {");
	expect(sdk).toContain("id: string;");
	expect(sdk).toContain("createdAt: string;");
	expect(sdk).not.toMatch(/export type PostVariants(?:200|MutationRequest) = any/);
});
