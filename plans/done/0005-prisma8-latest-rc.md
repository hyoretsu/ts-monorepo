# Full Prisma 8 latest RC migration

Approved source: `/home/hyoretsu/.claude/plans/rosy-chasing-flask.md`.
Scope: template only, isolated branch `feat/prisma8-latest-rc`. Do not integrate into the original checkout; coordinator owns integration and preservation of unrelated branding work.

## Sequential execution

1. [complete] Verify published CLI/runtime RC compatibility, inspect APIs, and probe disposable PostgreSQL only.
2. [complete] Replace SQL workspace schema, generated contract, runtime and migration graph. Preserve historical migrations and physical database contracts; support fresh and legacy migration paths.
3. [complete] Adopt ORM/builder consumers, shared transaction/outbox behavior, and custom BetterAuth adapter without changing HTTP contracts.
4. [complete] Update generation, seed, disposable runner, Docker/CI and engineering docs; remove obsolete active tooling.
5. [complete] Validate disposable integration/E2E and affected builds/types before handoff; inventory raw SQL exceptions, archive this plan when code-complete.

## Validation and boundaries

- Registry verified: `prisma@8.0.0-rc.29`, `@prisma/orm-postgres@8.0.0-rc.22`; pin exact compatible versions after probe.
- Local Bun 1.4.4 and Docker 29.9.0 available.
- No external DB commands, push, deploy or signing. No changes to global agent configuration.
- Commit coherent increments using hooks, local Git identity and Claude coauthor trailer.
- No manual lint/type checks except required pre-merge checks.

## Progress / blockers

- Initial target worktree clean. Existing task branch verified.
- Backend consumers and existing tests ported; integration passed 15 tests / 41 assertions, including nested rollback and deferred best-effort afterCommit. E2E pending.
- Prisma 8 TypeBox generator replaces Prismabox while preserving `sql/typebox`: Plain/create/update schemas feed actual Variant DTOs. Backend OpenAPI export and frontend Kubb generation passed; dedicated equivalence/HTTP tests passed 3 tests / 32 assertions. Nonfatal backend static-directory warning comes from export-only application initialization with no static assets.
- Latest CLI rc29 pins toolchain rc21, whose authoring descriptor guard does not recognize runtime rc22 typeChoice descriptors. Explicit root overrides align orm-toolchain and orm-framework to rc22. Standard contract emission and native disposable migration now pass; no dependency source patches.
- Disposable PostgreSQL 18 probe verified native graph application and ORM rollback. Original historical Prisma SQL remains immutable. Native contract preserves mapped tables, timestamps as Date, update generators, exact legacy index names and Variant checks.
- Final immutable-history compatibility correction preserves JSONB rather than JSON and legacy unique indexes rather than unique constraints. Native explicit conversions were authored and self-emitted through MigrationCLI; legacy application tables need no DDL.
- Final `bun scripts/test-runner.ts sql integration`: 4 tests / 36 assertions passed. Backend integration: 15 / 41 passed. Backend E2E: 2 / 26 passed. SQL E2E via `bun run --cwd packages/sql test:e2e`: 3 / 17 passed, covering fresh graph/full verification, historical SQL replay, data/schema preservation, repeat adoption and fail-closed drift.
- Supported signing was exercised only after schema-only verification against runner-created uniquely named localhost disposable legacy database. No remote/shared signing or schema operations occurred.
- Final root `bun run check-types` and `bun run build` passed after storage correction. Hook-driven validation passed core commit `9bb81de` and tooling/docs commit `e53b6aa`; final adoption commit follows.
- Watcher integration: 4 passed. Exact mapped check-body warnings are expected because physical legacy names are intentionally preserved; full schema verification proves their PostgreSQL text matches. Backend OpenAPI export static-directory warning is nonfatal because the template has no static assets.
- Raw application exceptions: outbox atomic CTE lease/claim with SKIP LOCKED and transaction-scoped advisory lock only. Migration DDL/JSONB casts and shared BEGIN/COMMIT/ROLLBACK remain SQL by design.
- Code-complete. Developer review, Docker image build and original-branch integration remain coordinator responsibilities; Dockerfile runtime graph copying was updated but image builds were not run. Original checkout and unrelated branding WIP remain untouched. Build-generated branding churn in this initially clean task worktree was discarded, never committed.
