# Template-specific engineering rules

Read before implementation or review. These rules supplement [AGENTS.md](../AGENTS.md); product/domain policies belong in [business-rules.md](business-rules.md). Adapt this file to each new project, preserving real paths and stack-specific constraints.

## Template architecture

- Keep Prisma 7 + Kysely + Prismabox. Do not migrate to Prisma 8 contracts. Models live in packages/sql/src/models; version SQL migrations under packages/sql/src/migrations.
- Keep Elysia modules, useCases, repositories and TypeBox DTOs. Compose repository writes and outbox events through the shared UnitOfWork. Kysely queries must use the transaction's $kysely client.
- Redis, RabbitMQ and worker are active by default. Use service-namespace.ts for every key, exchange and queue, including retry/DLQ; template is production, template_dev is non-production, SERVICE_NAMESPACE overrides both. Never reuse a production namespace in development.
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

`scripts/dev-migration-watch.sh` polls `packages/sql/src/migrations`,
`packages/sql/src/models` and `packages/sql/prisma.config.ts` every five seconds.
After two stable observations of changed contents, it terminates PID 1;
`restart: unless-stopped` reruns startup and migrations. No host watcher, attached
terminal, systemd or Docker socket mount is needed. Generated output and source-only
changes do not trigger container restarts; Bun/Vite keep their normal hot reload.
Migration `refs/` directories are ignored to prevent generated state from causing
restart loops. Model changes alone do not create migrations; author and version
the corresponding SQL migration first.

After updating an existing stack, recreate it with
`docker compose up -d --remove-orphans` to replace the old prepare/API/worker/frontend
services. This runs migrations against the configured database; remote/shared
databases still require explicit per-instance authorization.

## Mobile keyboard avoidance

Shared dialogs follow the VisualViewport height and offset, keeping headers and
footers above the software keyboard. Popovers must also fit that viewport, including
searchable selectors. Keep option lists shrinkable inside ScrollArea. Focus recovery
may scroll only the input's own ScrollArea, never a background page or parent modal.
