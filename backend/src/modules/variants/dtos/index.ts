import { t } from "elysia";
import { VariantPlain, VariantPlainInputCreate, VariantPlainInputUpdate } from "sql/typebox";

const nullable = <T extends ReturnType<typeof t.String>>(schema: T) => t.Optional(t.Nullable(schema));
const url = t.String({ format: "uri", maxLength: 2048, pattern: "^https?://[^\\s]+$" });
const colorMap = t.Record(
	t.String({ pattern: "^[a-z][a-zA-Z-]*$" }),
	t.String({ pattern: "^#[0-9a-fA-F]{6}$" }),
);
export const VariantFields = t.Object(
	{
		allowThemeToggle: t.Optional(t.Nullable(t.Boolean())),
		apiUrl: nullable(url),
		defaultTheme: t.Optional(
			t.Nullable(t.Union([t.Literal("light"), t.Literal("dark"), t.Literal("system")])),
		),
		fontFamily: nullable(t.String({ maxLength: 200, minLength: 1 })),
		fontUrl: nullable(url),
		footerText: nullable(t.String({ maxLength: 2000 })),
		logoUrl: nullable(url),
		mobileIconUrl: nullable(url),
		name: t.String({ maxLength: 200, minLength: 1, pattern: "\\S" }),
		nativePackageId: nullable(
			t.String({ maxLength: 255, pattern: "^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+$" }),
		),
		siteUrl: nullable(url),
		slug: t.String({ maxLength: 100, pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" }),
		themeColors: t.Optional(
			t.Nullable(
				t.Object(
					{ dark: t.Optional(colorMap), light: t.Optional(colorMap) },
					{ additionalProperties: false },
				),
			),
		),
	},
	{ additionalProperties: false },
);
// Domain validation deliberately refines the generated persistence contract.
// Omit server-owned fields and override storage types with HTTP constraints.
export const CreateVariantBody = t.Object(
	{
		...t.Omit(VariantPlainInputCreate, ["id", "createdAt", "updatedAt"]).properties,
		...VariantFields.properties,
	},
	{ additionalProperties: false },
);
export type CreateVariantBody = typeof CreateVariantBody.static;
export const UpdateVariantBody = t.Object(
	{
		...t.Omit(VariantPlainInputUpdate, ["id", "createdAt", "updatedAt"]).properties,
		...t.Partial(VariantFields).properties,
	},
	{ additionalProperties: false },
);
export type UpdateVariantBody = typeof UpdateVariantBody.static;
export const VariantReturn = t.Object({
	...VariantFields.properties,
	createdAt: t.String(),
	id: VariantPlain.properties.id,
	updatedAt: t.String(),
});
export const VariantError = t.Object({ error: t.String() });
