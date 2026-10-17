# Template foundation

Approved scope: Prisma 7 + Kysely + Prismabox; Radix/ShadCN; active local Redis/RabbitMQ/worker; no guest mode, observability, unit tests or coverage.

## Progress
- [x] Backend: domain, transactions, outbox, worker, cache, auth storage and Example API.
- [x] Frontend: Radix/ShadCN, shared UI, authenticated example, native links.
- [x] Operations: local Compose, isolated integration/E2E runner, workflows and docs.
- [x] Guidelines: synchronize uploaded coding rules in template and Zaimu.
- [x] Verification and local integration commits.

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

## Completed runtime and native validation

- Operations committed in 148fba7; normal type, format/lint and commit-message hooks passed.
- Integration: 7 passing scenarios. API/SQL E2E: 2 passing scenarios. Browser: 4 passing desktop/mobile scenarios. External performance: 1 passing scenario.
- Full build passed; OpenAPI/SDK generation validated without schema warnings. Both Compose manifests validated without starting services.
- Linux cargo check passed offline. Association artifact generation passed with local test identifiers; generated test artifacts removed. Android/iOS signing and distribution remain environment-specific setup, not a local deployment task.
- Restored native tracked changes from the preserved pre-sync stash after Lefthook could not restore hidden unstaged changes. Native entrypoint and platform guards match the validated implementation.
- Pending: commit native artifacts and shared rules, then fast-forward the original template main locally.

## Completion

- Infrastructure and native increments committed with the local Git user as author/committer and Codex attribution. Normal hooks passed.
- Shared guidelines restored from the preserved stash, reconciled with actual Lefthook paths and the single-option select invariant. Zaimu rules were already integrated through f3b6ccc1.
- Final verification passed: full web/backend build, affected package types, integration/API/SQL E2E, desktop/mobile browser scenarios, external browser timings, Compose configuration and offline Linux cargo check.
- Integration target is the original local template main. Preserve its pre-existing edits in a named stash before fast-forwarding; original workflow edits are already represented by the upstream commits, and current user/committer rules supersede older agent-author wording.
- No push, deployment, shared database migration or external mutation performed. Associated Android/iOS release builds require each derived application's identifiers and signing setup.
