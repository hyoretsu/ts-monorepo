import { createAuthClient } from "better-auth/react";
import { branding } from "./branding";
export const authClient = createAuthClient({
	basePath: "/auth",
	baseURL: branding.apiUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:3333",
});
export type AuthSession = ReturnType<typeof authClient.useSession>;
