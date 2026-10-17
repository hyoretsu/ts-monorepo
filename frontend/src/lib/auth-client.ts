import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
	basePath: "/auth",
	baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333",
});
export type AuthSession = ReturnType<typeof authClient.useSession>;
