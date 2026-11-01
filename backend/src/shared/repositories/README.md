# Repositories and transactions

Use createPrismaUnitOfWork with the shared database client. All repositories and outbox writes participate in the same physical transaction through withTransaction. Use db.orm.public for model CRUD and db.sql.public with db.query/db.execute for builder plans; never construct an independent pool inside a transaction. Nested units share the outer commit and rollback. afterCommit is for best-effort cache effects; durable effects belong in the outbox.
