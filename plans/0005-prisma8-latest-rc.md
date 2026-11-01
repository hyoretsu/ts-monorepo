# Full Prisma 8 latest RC migration

Approved source: `/home/hyoretsu/.claude/plans/rosy-chasing-flask.md`.
Scope: template only, isolated branch `feat/prisma8-latest-rc`. Do not integrate into the original checkout; coordinator owns integration and preservation of unrelated branding work.

## Sequential execution

1. [complete] Verify published CLI/runtime RC compatibility, inspect APIs, and probe disposable PostgreSQL only.
2. [pending] Replace SQL workspace schema, generated contract, runtime and migration graph. Preserve historical migrations and physical database contracts; support fresh and legacy migration paths.
3. [pending] Adopt ORM/builder consumers, shared transaction/outbox behavior, and custom BetterAuth adapter without changing HTTP contracts.
4. [pending] Update generation, seed, disposable runner, Docker/CI and engineering docs; remove obsolete active tooling.
5. [pending] Validate disposable integration/E2E and affected builds/types before handoff; inventory raw SQL exceptions, archive this plan when code-complete.

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
- Pending: legacy adoption replay/verification, complete SQL tests, hook validation/builds, tooling/docs handoff and final code-complete archive.
