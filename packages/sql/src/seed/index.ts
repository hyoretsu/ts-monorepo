import { closeDatabase } from "..";

// Add project-specific seed operations here. Invoking this file is explicit:
// contract emission and application startup never seed a configured database.
await closeDatabase();
