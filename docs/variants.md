# Optional branding variants

`VARIANT` is a single lowercase slug (`acme`, `acme-br`). Missing, empty and whitespace-only
values select the canonical template defaults. Default preparation never queries branding data
or downloads branding assets. Database client generation and application runtime retain their
normal database requirements. Unknown nonempty slugs fail preparation.

Create variants through the administrator-only `/variants` API. Variant records store required
`slug` and `name`, with optional URL, font, theme, footer and native identifier overrides.
Null overrides restore canonical defaults. Theme overrides use validated hexadecimal colors.
Do not edit generated branding outputs: change canonical defaults or the database record.

New and existing users have role `user`. Signup/profile requests cannot assign a role.
Bootstrap an administrator only through an explicit operator database action against the intended
database, for example `UPDATE "user" SET role = 'admin' WHERE id = '<reviewed-user-id>';`.
Review the user first. This repository never runs that operation automatically. No management UI
or public administrator-promotion endpoint exists. List/read/create/update/delete require an
administrator session; anonymous and ordinary users receive authentication/authorization errors.

## Local preparation

`bun run variant:prepare` in backend/frontend prepares branding. Direct `dev`, `build`,
`check-types`, backend `export`, and Tauri scripts prepare first. Turbo runs the preparation
prerequisite too. Preparation validates complete selected configuration and downloads before
replacing outputs; every successful preparation restores canonical defaults before applying
selected overrides. Restart development watchers after changing selection or database branding.

Examples (from repository root):

```sh
VARIANT=acme bun run build
VARIANT=acme bun -F backend export
VARIANT=acme bun -F frontend tauri:build
VARIANT='' bun run build
```

Branding tasks intentionally disable Turbo caching: database rows can change without a source
commit. `VARIANT` passes through Turbo explicitly; database credentials pass through without
being embedded in artifacts. Dockerfiles accept `--build-arg VARIANT=acme` and BuildKit secret
`--secret id=DATABASE_URL,env=DATABASE_URL`. For direct selected builds, pass a new
`--build-arg BRANDING_REVISION=<revision>` whenever database branding changes (or disable build
cache); workflow jobs supply run ID/attempt automatically. Default builds require no branding database access.
Worker uses the same backend branding preparation. Never put database credentials in build args.

## Workflow contract

Configure repository variable `VARIANTS` as newline-separated slugs:

```text
acme
acme-br
```

Entries are trimmed, deduplicated and validated by `scripts/variant-matrix.ts`; absent/blank
configuration yields exactly one default entry. CSV, uppercase, paths and shell fragments fail.
Each matrix job sets singular `VARIANT` and combines selection with existing package/platform
axes. Existing affected-package gates remain. Selected variants require matching database records
and read access through the workflow's `DATABASE_URL` secret. Default jobs retain existing names,
images and release tags. Selected variants append `-<slug>` to names/images/cache scopes/release
tags. Container publishing uses the shared `containers` action with `image_suffix` and GHCR defaults. Docker build argument `BRANDING_REVISION` includes workflow run ID/attempt to invalidate mutable database branding while retaining reusable dependency layers;
Rust target directories isolate selections. Associated-link files and native overlays are removed when selection, site URL or native identifier changes. Native artifacts are isolated by release and branded
application name. iOS remains a stub; no publication path is enabled by this change.

Native mobileIconUrl overrides must use a square PNG or SVG; omitted native artwork restores canonical icons.
A selected native variant must define its own package identifier before store publication.
The existing global Android store configuration still gates publication; selected variants use
the generated native identifier as the store package, while default publication retains the global
package setting. Signing credentials are never stored in variants.

## Schema and verification

Migration lives in `packages/sql/src/migrations/20261018000000_variants/`. Operators apply versioned
migrations separately to their intended databases. Implementation does not apply remote migrations.
Integration/E2E scenarios use disposable local services through `scripts/test-runner.ts`; no unit
or coverage gates are introduced. Formatting, lint and type validation run through normal commit
hooks. Full native/Docker builds require their installed local toolchains and cached dependencies.

Run branding switching checks in an isolated checkout with `bun test scripts/tests/branding.integration.test.ts`; this uses loopback fixtures, rewrites generated outputs, then restores defaults. CRUD E2E lives in `backend/tests/variants.e2e.test.ts` and uses disposable local services.
