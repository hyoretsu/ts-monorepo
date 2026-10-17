# Template architecture

## Local development

Copy `.env.example` to `.env` for host development, or run `docker compose up` for the complete local stack. Compose prepares only its own PostgreSQL service. Mailpit receives development email at http://localhost:8025. Register a user through Better Auth `/auth/sign-up/email`, then sign in on the homepage.

API, worker, Redis and RabbitMQ are enabled by default. Production images use `compose.production.yaml`; supply image references, credentials, service URLs, matching SERVICE_NAMESPACE and strong Better Auth secrets yourself. No deployment or migration against external databases is part of setup.

## Modules and transactions

Keep `infra`, `useCases`, `dtos` and barrel conventions. `@template/domain` holds pure shared rules. Extend the repository context for new modules. Every business write and durable event belongs inside the same UnitOfWork transaction. Prisma and the transaction's `$kysely` share a connection. Use afterCommit only for best-effort effects.

Example creation writes an outbox event. The publisher leases pending rows and retries failures; the worker processes events with transactional receipts and emits a completion event. Delivery is at least once. Keep handlers idempotent. Redis generation keys prevent old concurrent fills from populating a new cache generation. Cache failures fall back to PostgreSQL; invalidation retries through RabbitMQ. Session mirrors never authorize a revoked database session.

Namespace all Redis and RabbitMQ resources through the shared namespace helpers. API and worker must use the same namespace; never share development and production namespaces. Retry and dead-letter queues belong to that same namespace.

## Contracts and UI

Run `bun -F sql export`, `bun -F backend export`, then `bun -F frontend generate`. Builds and codegen require no live database. Never edit generated SDK files. Register all visible copy in locale resources.

UI uses Radix/ShadCN and existing Tailwind tokens. Add primitives through ShadCN CLI, then normalize names to PascalCase. Dialog owns history and scroll boundaries; DialogBody is the only scrolling modal region. Use shared fields, ScrollArea, ActionGroup and ConfirmActionButton instead of native replacements.

## Native links

Set VITE_APP_URL and VITE_APP_SCHEME, plus APPLE_TEAM_ID, APP_IDENTIFIER and ANDROID_SHA256_FINGERPRINTS for associated builds. `bun -F frontend links:generate --strict` writes local association artifacts and Tauri link configuration. Deploy those artifacts yourself. Unsigned local desktop builds do not require association identifiers. Never commit signing secrets.
