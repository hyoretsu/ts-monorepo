import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { TooltipProvider } from "./components/ui/Tooltip";
import { reactQueryClient } from "./lib/query-cache";
export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={reactQueryClient}>
			<TooltipProvider>{children}</TooltipProvider>
		</QueryClientProvider>
	);
}
