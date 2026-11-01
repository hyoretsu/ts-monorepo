# Full Prisma 8 latest RC migration

Approved source: `/home/hyoretsu/.claude/plans/rosy-chasing-flask.md`.
Scope: template only, isolated branch `feat/prisma8-latest-rc`. Do not integrate into the original checkout; coordinator owns integration and preservation of unrelated branding work.

## Sequential execution

1. [in progress] Verify published CLI/runtime RC compatibility, inspect APIs, and probe disposable PostgreSQL only.
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
- Backend consumer implementation delegated as bounded work; SQL/runtime contract remains coordinated here.
