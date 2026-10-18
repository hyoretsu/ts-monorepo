import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { TooltipProvider } from "./components/ui/Tooltip";
import { branding } from "./lib/branding";
import { reactQueryClient } from "./lib/query-cache";
export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={reactQueryClient}>
			<TooltipProvider>
				{children}
				{branding.footerText && (
					<footer className="p-4 text-center text-muted-foreground text-sm">{branding.footerText}</footer>
				)}
			</TooltipProvider>
		</QueryClientProvider>
	);
}
