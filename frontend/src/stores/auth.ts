import { create } from "zustand";

export type UserRole = "USER" | "ADMIN";
export type KycStatus = "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface AuthUser {
	createdAt: number | string | Date;
	document: string | null;
	email: string;
	emailVerified: boolean;
	id: string;
	image: string | null;
	kycStatus: string;
	name: string;
	role: string;
}

export interface AuthState {
	hydrated: boolean;
	isAuthenticated: boolean;
	role: string | null;
	setUser: (user: AuthUser | null) => void;
	user: AuthUser | null;
}

export const useAuthStore = create<AuthState>(set => ({
	hydrated: false,
	isAuthenticated: false,
	role: null,
	setUser: user =>
		set({
			hydrated: true,
			isAuthenticated: !!user,
			role: user?.role ?? null,
			user,
		}),
	user: null,
}));

export function isAdmin(role: string | null | undefined): boolean {
	return role === "ADMIN";
}
