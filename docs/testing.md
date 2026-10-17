# Integration and E2E

No unit tests, coverage or unit-test gates are included. Pre-commit formats/lints staged files and type-checks affected packages.

Install Docker with a local Unix socket, then pull `postgres:16`, `redis:7-alpine` and `rabbitmq:4-alpine`. Run `bun test:integration` and `bun test:e2e`. The runner requires those cached images, publishes loopback-only random ports, replaces inherited service URLs, sets a unique namespace, applies migrations only to its disposable database and cleans up containers after every run. Direct DB-backed tests outside the runner reject execution.

Backend tests live under `backend/tests`; SQL tests under `packages/sql/tests`. Integration files end in `.integration.test.ts`, API/database E2E in `.e2e.test.ts`. Add tests under those directories to participate automatically. Failures return nonzero exit status; no tests selected also fails.

Browser scenarios run with `bun -F frontend test:e2e`, using Vite fixtures without a database. The performance configuration measures browser timings externally and adds no runtime telemetry.
