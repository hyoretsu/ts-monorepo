import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

interface Field {
	nullable: boolean;
	type: { kind: string; codecId?: string };
	many?: false | { elementNullable: boolean };
	valueSet?: { namespaceId: string; entityName: string };
}
interface Model {
	fields?: Record<string, Field>;
	storage: { namespaceId: string; table: string; fields: Record<string, { column: string }> };
}
interface Contract {
	storage: {
		namespaces: Record<
			string,
			{
				entries: {
					table: Record<
						string,
						{ columns: Record<string, { default?: unknown; generated?: unknown }> }
					>;
				};
			}
		>;
	};
	execution?: {
		mutations?: {
			defaults?: { ref: { namespace: string; entry: string; field: string }; onCreate?: unknown }[];
		};
	};
	domain: {
		namespaces: Record<
			string,
			{
				models: Record<string, Model>;
				enum?: Record<string, { members: { name: string; value: unknown }[] }>;
			}
		>;
	};
}

// Match Prismabox's default (non-JSON) scalar schemas, not the ORM's TS types.
// Unknown codecs deliberately fail: guessing can silently widen HTTP validation.
const scalars: Record<string, string> = {
	"pg/bool@1": "t.Boolean()",
	"pg/bytea@1": "t.Uint8Array()",
	"pg/date-date@1": "t.Date()",
	"pg/float4@1": "t.Number()",
	"pg/float8@1": "t.Number()",
	"pg/int2@1": "t.Integer()",
	"pg/int4@1": "t.Integer()",
	"pg/int8@1": "t.Integer()",
	"pg/json@1": "t.Any()",
	"pg/jsonb@1": "t.Any()",
	"pg/numeric@1": "t.Number()",
	"pg/text@1": "t.String()",
	"pg/timestamp-date@1": "t.Date()",
	"pg/timestamptz-date@1": "t.Date()",
	"pg/uuid@1": "t.String()",
	"pg/varchar@1": "t.String()",
};

const identifier = /^[A-Za-z_$][\w$]*$/;

export function renderTypebox(contract: Contract): Map<string, string> {
	const files = new Map<string, string>();
	const names = new Set<string>();
	for (const [namespaceId, namespace] of Object.entries(contract.domain.namespaces)) {
		for (const [name, model] of Object.entries(namespace.models)) {
			if (!identifier.test(name) || names.has(name)) {
				throw new Error(`Unsafe or ambiguous TypeBox model export: ${namespaceId}.${name}`);
			}
			names.add(name);
			const properties = Object.entries(model.fields ?? {}).map(([fieldName, field]) => {
				const location = `${namespaceId}.${name}.${fieldName}`;
				let expression: string | undefined;
				if (field.valueSet) {
					const values = contract.domain.namespaces[field.valueSet.namespaceId]?.enum?.[
						field.valueSet.entityName
					]?.members.map(member => member.value);
					if (!values?.length) throw new Error(`Unresolved enum at ${location}`);
					expression = `t.Union([${values.map(value => `t.Literal(${JSON.stringify(value)})`).join(", ")}])`;
				} else if (field.type.kind === "scalar") {
					expression = scalars[field.type.codecId ?? ""];
				}
				if (!expression)
					throw new Error(
						`Unsupported TypeBox field at ${location}: ${JSON.stringify(field.type)}`,
					);
				if (field.many) {
					if (field.many.elementNullable) expression = `t.Union([t.Null(), ${expression}])`;
					expression = `t.Array(${expression})`;
				}
				if (field.nullable) expression = `t.Union([t.Null(), ${expression}])`;
				return `\t${JSON.stringify(fieldName)}: ${expression},`;
			});
			const createProperties = Object.entries(model.fields ?? {}).flatMap(
				([fieldName, field], index) => {
					const mapping = model.storage.fields[fieldName];
					const column =
						contract.storage.namespaces[model.storage.namespaceId].entries.table[
							model.storage.table
						].columns[mapping.column];
					if (column.generated) return [];
					const hasDefault =
						column.default !== undefined ||
						contract.execution?.mutations?.defaults?.some(
							item =>
								item.ref.namespace === model.storage.namespaceId &&
								item.ref.entry === model.storage.table &&
								item.ref.field === mapping.column &&
								item.onCreate !== undefined,
						);
					const property = properties[index];
					if (!field.nullable && !hasDefault) return [property];
					const separator = property.indexOf(": ");
					return [
						`${property.slice(0, separator + 2)}t.Optional(${property.slice(separator + 2, -1)}),`,
					];
				},
			);
			files.set(
				`${name}Plain.ts`,
				[
					"// Generated from Prisma 8 contract JSON. Do not edit.",
					'import { t, type UnwrapSchema } from "elysia";',
					`export const ${name}Plain = t.Object({`,
					...properties,
					"}, { additionalProperties: true });",
					`export type ${name}Plain = UnwrapSchema<typeof ${name}Plain>;`,
					`export const ${name}PlainInputCreate = t.Object({`,
					...createProperties,
					"}, { additionalProperties: true });",
					`export type ${name}PlainInputCreate = UnwrapSchema<typeof ${name}PlainInputCreate>;`,
					`export const ${name}PlainInputUpdate = t.Partial(${name}PlainInputCreate);`,
					`export type ${name}PlainInputUpdate = UnwrapSchema<typeof ${name}PlainInputUpdate>;`,
					"",
				].join("\n"),
			);
		}
	}
	files.set(
		"barrel.ts",
		`${[...names].map(name => `export { ${name}Plain, ${name}PlainInputCreate, ${name}PlainInputUpdate } from "./${name}Plain";`).join("\n")}\n`,
	);
	return files;
}

export async function generateTypebox(contractPath: string, outputPath: string) {
	const files = renderTypebox(await Bun.file(contractPath).json());
	await mkdir(outputPath, { recursive: true });
	for (const [name, source] of files) await writeFile(resolve(outputPath, name), source);
	return files;
}

if (import.meta.main) {
	const [, , contractPath, outputPath] = process.argv;
	if (!contractPath || !outputPath) {
		throw new Error("Usage: bun generate-typebox.ts <contract.json> <output-directory>");
	}
	await generateTypebox(resolve(contractPath), resolve(outputPath));
}
