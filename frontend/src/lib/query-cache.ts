import { QueryClient } from "@tanstack/react-query";
export const reactQueryClient = new QueryClient({
	defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});
export const queryKeys = { examples: (userId: string) => ["identity", userId, "examples"] as const };
export const invalidateExamples = (userId: string) =>
	reactQueryClient.invalidateQueries({ queryKey: queryKeys.examples(userId) });
