import { create } from "zustand";
import { authClient } from "@/lib/auth-client";
import { reactQueryClient } from "@/lib/query-cache";

type AuthUser = NonNullable<Awaited<ReturnType<typeof authClient.getSession>>["data"]>["user"];
export interface AuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	hydrated: boolean;
	error: string | null;
	role: string | null;
	clearError: () => void;
	setUser: (user: AuthUser | null) => void;
	logout: () => Promise<void>;
	signIn: (input: {
		email: string;
		password: string;
		invalidCredentialsMessage: string;
		defaultUserName: string;
	}) => Promise<void>;
}
export const useAuthStore = create<AuthState>(set => ({
	clearError: () => set({ error: null }),
	error: null,
	hydrated: false,
	isAuthenticated: false,
	isLoading: false,
	logout: async () => {
		const result = await authClient.signOut();
		if (result.error) {
			set({ error: result.error.message });
			return;
		}
		reactQueryClient.clear();
		set({ isAuthenticated: false, role: null, user: null });
	},
	role: null,
	setUser: user => {
		reactQueryClient.clear();
		set({ hydrated: true, isAuthenticated: !!user, role: null, user });
	},
	signIn: async ({ email, password, invalidCredentialsMessage }) => {
		set({ error: null, isLoading: true });
		try {
			const result = await authClient.signIn.email({ email, password });
			if (result.error) {
				set({ error: result.error.message || invalidCredentialsMessage });
				return;
			}
			reactQueryClient.clear();
			set({ hydrated: true, isAuthenticated: true, user: result.data.user });
		} catch {
			set({ error: invalidCredentialsMessage });
		} finally {
			set({ isLoading: false });
		}
	},
	user: null,
}));
export const isAdmin = (role: string | null | undefined) => role === "ADMIN";
