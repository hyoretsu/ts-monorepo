# Template-specific engineering rules

Read before implementation or review. These rules supplement [AGENTS.md](../AGENTS.md); product/domain policies belong in [business-rules.md](business-rules.md). Adapt this file to each new project, preserving real paths and stack-specific constraints.

## Legacy database adoption

Fresh disposable databases replay the native graph with `bun run --cwd packages/sql migrate:deploy`. Historical Prisma 7 SQL remains immutable and is replayed only by the legacy compatibility scenario, not by normal startup. Native storage preserves JSONB, existing unique index names, check constraints, timestamp precision and Date values; legacy adoption does not alter application tables or data.

`packages/sql/scripts/adopt-legacy.ts` is deliberately limited to runner-owned localhost databases named exactly `<template_test_namespace>_legacy`. It rejects inherited/shared targets, verifies the actual schema with `prisma db verify --schema-only`, snapshots application data, then uses official `db sign --no-advance-ref` and full verification. It never repairs drift or signs a mismatching schema. The disposable E2E scenario proves fresh deployment, preserved legacy data/storage, repeat adoption and fail-closed unsigned/signed drift.

This test helper is not operator authorization. Adopting a developer, shared or production database requires separate explicit authorization for that exact target and command, review of schema-only verification and preserved-data evidence, then the supported signature workflow. Application startup and contract generation never perform adoption or signing. Deployment refs are environment state; disposable test refs must not be committed.

## Template architecture

- Use native Prisma 8 PostgreSQL contracts. The source contract is `packages/sql/src/contract.prisma`; `prisma contract emit` produces `out/prisma/contract.json` and `contract.d.ts`, then the custom generator produces `out/typebox/barrel.ts`. Version the native migration graph under `packages/sql/migrations/app` (with its snapshots under `packages/sql/migrations/snapshots`). Preserve `packages/sql/src/migrations` as immutable historical SQL, not the active migration graph.
- Compatibility invariant: Prisma CLI `8.0.0-rc.29` and `@prisma/orm-postgres` `8.0.0-rc.22` require root overrides pinning `@prisma/orm-toolchain` and `@prisma/orm-framework` to `8.0.0-rc.22`. The rc.21 CLI descriptor is incompatible; update these together when upgrading the release candidates.
- Keep Elysia modules, useCases, repositories and TypeBox DTOs. Compose repository writes and outbox events through the shared UnitOfWork. Use the SQL runtime exports `db`, `DatabaseClient`, `withTransaction`, `afterCommit`, `queryRaw`, `executeRaw`, `closeDatabase`, `and` and `or`; ORM and builder work must share the active transaction. The remaining application raw SQL exceptions are the atomic outbox lease/claim CTE with `FOR UPDATE SKIP LOCKED` (`backend/src/shared/infra/outbox/PrismaOutbox.ts`) and PostgreSQL transaction-scoped advisory locks (`backend/src/modules/example/useCases/ProcessExample.ts`). Migration DDL and transaction-control statements remain SQL by design; ordinary CRUD and receipt projections use ORM/builder.
- Redis, RabbitMQ and worker are active by default. Use service-namespace.ts for every key, exchange and queue, including retry/DLQ; template is production, template_dev is non-production, SERVICE_NAMESPACE overrides both. Never reuse a production namespace in development.
- External service calls may use the shared Redis-backed DistributedCircuitBreaker (`backend/src/shared/infra/DistributedCircuitBreaker.ts`). Name each dependency with a stable service identifier, explicitly classify successes/failures/ignored outcomes, and configure rolling window, minimum samples, failure ratio, open interval and probe lease. State is shared across workers; Redis unavailability denies calls rather than silently bypassing the breaker. A half-open permit is single-probe and leased, with fenced completions; expiry reopens the breaker for another cooldown, but does not cancel an in-flight operation. Closed-state permit completions are idempotent within the rolling window. Breakers do not retry operations, especially mutations. Use `inspect()` and transition callbacks for diagnostics, not as a substitute for handling denied calls.
- Broker delivery is at least once. Use transactional consumer receipts, idempotent handlers, bounded retries, DLQ and outbox publication confirms. Never publish a durable business event independently of its database transaction.
- Frontend uses Radix/ShadCN and Tailwind. Add primitives through ShadCN CLI and normalize component filenames to PascalCase. No BaseUI, Styletron, guest mode, IndexedDB synchronization or runtime observability is part of this base.
- Every modal uses Dialog with DialogBody/ScrollArea between fixed header/footer. Back closes the topmost modal; buttons/Escape/overlay consume its history step without shifting page/background scroll. Keep form body/footer inside the same form.
- Loading another page preserves existing data, keys, container and scroll. Show incremental loading/error feedback after existing content; full skeletons belong to initial load/filter changes.
- Use ActionGroup and DialogFooter for right-aligned, wrapping actions; compact mobile actions stay side by side when they fit.
- CustomSelect automatically chooses the only enabled option through onChange when selection is absent or invalid. Count all options, including special options, before search filtering; preserve valid selection and never choose disabled options.
- Dynamic CustomSelect listings are searchable; special options stay first and visible during every search.
- Date selectors use DateField or DateRangePicker, never native date/month/week inputs or showPicker.
- Single-line fields share inputControlClassName; related columns use FormFieldRow. Mark required fields with RequiredMark, never label optional fields redundantly. Validate submitted native values before mutation to avoid stale debounced values.
- Pending mutations disable only overlapping records/actions. Reversible actions act immediately with toast feedback; permanent destructive actions use ConfirmActionButton with a three-second second-click confirmation.
- Keep all user-facing copy in locale resources. Use normal hyphens in UI, documentation and tests. Do not render raw enum values.
- Native association artifacts use configured application identifiers/domains. Never embed credentials or signing material. Generate SDK through sql export, backend export and frontend generate; never edit generated code.

## Continuous delivery

See [CD configuration and release guide](development/cd.md) for image matrices,
version-tagged native releases, iOS signing and explicit Google Play promotion.
Keep app publication downstream of all selected platform builds and preserve
variant isolation in the template.

## Formatting and linting

Bun 1.4.4+ owns formatting through the root `bunfig.toml` `[fmt]` section. Use
`bun run format` to write formatting and `bun run format:check` to check it.
`bun run lint` checks remaining Biome/ESLint rules and Biome sorting assists;
`bun run lint:fix` applies their fixes and formats last. Keep Biome formatting,
import organization and class sorting disabled, including in nested presets,
so they cannot conflict with Bun. Preserve other lint rules and validation gates.

## API request timeouts

The shared SDK transport in `frontend/src/lib/api/client-api.ts` disables request
timeouts by default, including mutations. Resolve timeout after merging request
options with `options?.timeout ?? config.timeout ?? false`: an undefined timeout
resets Ky to its 10-second default. Explicit per-request deadlines and cancellation
remain supported. Never automatically retry mutations after transport failures:
a missing response does not prove that the backend rolled back the operation.

## Development migration reload

`docker compose up -d` runs API, worker and frontend together in the `dev` service.
Startup installs dependencies, generates SQL code and deploys migrations before
starting Turbo's development tasks. Keep the backend processes in one lifecycle
so schema changes cannot leave a separate worker running against an old schema.
Postgres, Redis, RabbitMQ and Mailpit remain separate services.

`scripts/dev-migration-watch.sh` polls `packages/sql/migrations`,
`packages/sql/src/contract.prisma` and `packages/sql/prisma.config.ts` every five seconds.
After two stable observations of changed contents, it terminates PID 1;
`restart: unless-stopped` reruns startup and migrations. No host watcher, attached
terminal, systemd or Docker socket mount is needed. Generated output and source-only
changes do not trigger container restarts; Bun/Vite keep their normal hot reload.
Migration `refs/` directories are ignored to prevent generated state from causing
restart loops. Contract changes alone do not create migrations; author and version
the corresponding native migration first.

After updating an existing stack, recreate it with
`docker compose up -d --remove-orphans` to replace the old prepare/API/worker/frontend
services. This runs migrations against the configured database; remote/shared
databases still require explicit per-instance authorization.

## Mobile keyboard avoidance

Shared dialogs follow the VisualViewport height and offset, keeping headers and
footers above the software keyboard. Popovers must also fit that viewport, including
searchable selectors. Keep option lists shrinkable inside ScrollArea. Focus recovery
may scroll only the input's own ScrollArea, never a background page or parent modal.
