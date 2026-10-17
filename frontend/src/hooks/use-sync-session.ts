import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth";
export function useSyncSession() {
	const session = authClient.useSession();
	const setUser = useAuthStore(state => state.setUser);
	useEffect(() => {
		if (!session.isPending && !session.error) setUser(session.data?.user ?? null);
	}, [session.data, session.isPending, session.error, setUser]);
	return session;
}
