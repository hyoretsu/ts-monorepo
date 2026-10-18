ALTER TABLE "user" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
CREATE TABLE "Variant" (
 "id" TEXT NOT NULL,
 "slug" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "apiUrl" TEXT, "siteUrl" TEXT, "logoUrl" TEXT, "mobileIconUrl" TEXT,
 "fontFamily" TEXT, "fontUrl" TEXT, "themeColors" JSONB,
 "defaultTheme" TEXT, "allowThemeToggle" BOOLEAN,
 "footerText" TEXT, "nativePackageId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Variant_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "Variant_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 CONSTRAINT "Variant_theme_check" CHECK ("defaultTheme" IN ('light', 'dark', 'system'))
);
CREATE UNIQUE INDEX "Variant_slug_key" ON "Variant"("slug");
