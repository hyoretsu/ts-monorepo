# Optional variants

Approved scope: database-backed optional branding, administrator-only management,
deterministic preparation, variant workflow matrices, and operator documentation.
All changes and validation stay local; migrations are versioned, never applied to external databases.

- [x] Add Variant model, migration, administrator authorization and CRUD.
- [x] Add default-safe resolution and deterministic web/email/native preparation.
- [x] Connect direct scripts, Turbo, Docker, worker and native workflows.
- [x] Validate disposable integration scenarios, builds and workflow matrices.
- [x] Document operator contracts and integrate local atomic commits.

Selection: absent, empty or whitespace VARIANT uses canonical defaults without branding queries.
VARIANTS is newline-separated, trimmed, validated and deduplicated; absent/blank yields one default.

Validation: normal commit hooks passed all affected type-checks, formatting and lint. Backend API/worker build, frontend production bundle, OpenAPI/SDK generation, matrix parsing and Turbo graph checks passed. Disposable local CRUD E2E passed 21 assertions. Branding integration passed blank resolution, A → B → defaults, native icon generation, stale fonts/assets/associated-link removal and invalid-config preservation. Local PostgreSQL/Redis only; no external migrations or services mutated.

Full Docker and native application compilation was not run: local cached base/toolchain prerequisites are not guaranteed. Docker secret/environment plumbing and native entrypoint preparation were inspected; native icon CLI was exercised. Database-only changes bypass Turbo caching; Docker build argument BRANDING_REVISION includes run ID/attempt. General logos may be wide; native overrides require a dedicated square PNG/SVG mobileIconUrl. Default native icons remain canonical when omitted.

Follow-up: adopt sim-delivery main’s simplified `containers@main` / `image_suffix` contract and GHCR defaults. Preserve variant image suffixes, worker Dockerfile, affected gates and native matrices. Move database-only invalidation to BRANDING_REVISION build args. Local checks passed YAML parsing, unchanged affected gates/package/platform/native matrices, container input contract, default/multiple/invalid variant parsing and Docker cache-argument placement. Normal hooks passed affected type-checks and formatting/lint. Direct backend API/worker and frontend package builds passed.
