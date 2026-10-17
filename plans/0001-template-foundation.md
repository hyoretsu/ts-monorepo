# Template foundation

Approved scope: Prisma 7 + Kysely + Prismabox; Radix/ShadCN; active local Redis/RabbitMQ/worker; no guest mode, observability, unit tests or coverage.

## Progress
- [x] Backend: domain, transactions, outbox, worker, cache, auth storage and Example API.
- [x] Frontend: Radix/ShadCN, shared UI, authenticated example, native links.
- [ ] Operations: local Compose, isolated integration/E2E runner, workflows and docs.
- [x] Guidelines: synchronize uploaded coding rules in template and Zaimu.
- [ ] Verification and local integration commits.

Preserve pre-existing edits in AGENTS.md and CI/CD workflows when integrating. Remote fetch authorized to synchronize six upstream commits; no push or external mutations.

## Upstream synchronization
- Fetched six upstream commits through 9d5c5a8 and rebased backend/hook increments.
- Preserved upstream root lefthook.yml and post-merge hook; retained staged dependency type checks and removed template unit gates.
- Reconciled AGENTS.md and worker CD additions with upstream changes.
- Linux cargo check passed after correcting native crate entrypoint. Final frontend/build/browser verification remains pending.

## Resumed verification

- Recovered the existing worktree and preserved the original template main edits.
- Disposable integration passed: six backend scenarios and Prisma/Kysely rollback.
- HTTP E2E exposed asynchronous Elysia module initialization and response handling; fixed both. Authenticated creation, worker processing and user isolation now pass.
- OpenAPI excludes internal wildcard routes, exports OpenAPI 3.1 and awaits module initialization. SDK regeneration validates without schema warnings.
- Docker runtime now includes SQL source required by the external workspace package. CI includes frontend browser scenarios; shared configuration changes trigger all package type checks.
- Final browser, native and hook validation and local integration remain in progress.
