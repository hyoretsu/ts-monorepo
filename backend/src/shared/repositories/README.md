# Repositories and transactions

Use createPrismaUnitOfWork with the root extended client. All repositories and outbox writes receive the same transaction client. Use db.$kysely inside that transaction for Kysely queries, never a separately constructed pool. afterCommit is for best-effort cache effects; durable effects belong in the outbox.
