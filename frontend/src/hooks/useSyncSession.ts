import { useEffect } from "react";
import { useGetAuthMe } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export function useSyncSession() {
	const setUser = useAuthStore(state => state.setUser);
	const query = useGetAuthMe({
		query: {
			refetchOnWindowFocus: false,
			staleTime: 60_000,
		},
	});

	useEffect(() => {
		if (query.isSuccess) {
			setUser(query.data?.user ?? null);
		} else if (query.isError) {
			setUser(null);
		}
	}, [query.data, query.isError, query.isSuccess, setUser]);

	return query;
}
