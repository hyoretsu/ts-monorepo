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
