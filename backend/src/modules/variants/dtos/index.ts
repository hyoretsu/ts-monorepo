import { t } from "elysia";

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
export const CreateVariantBody = VariantFields;
export type CreateVariantBody = typeof CreateVariantBody.static;
export const UpdateVariantBody = t.Partial(VariantFields);
export type UpdateVariantBody = typeof UpdateVariantBody.static;
export const VariantReturn = t.Object({
	...VariantFields.properties,
	createdAt: t.String(),
	id: t.String(),
	updatedAt: t.String(),
});
export const VariantError = t.Object({ error: t.String() });
