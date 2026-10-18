import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/index.css";
import { initializeDeepLinks } from "./lib/deep-links";
import { reactQueryClient } from "./lib/tanstack";
import { Providers } from "./Providers";
import { routeTree } from "./routeTree.gen";
import "./i18n/config";
import "./globals.css";

import { branding } from "./lib/branding";

const dark =
	branding.defaultTheme === "dark" ||
	(branding.defaultTheme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.classList.toggle("dark", dark);
document.documentElement.classList.toggle("light", !dark);

const router = createRouter({
	context: {
		queryClient: reactQueryClient,
	},
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	routeTree,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

void initializeDeepLinks(router);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Providers>
			<RouterProvider router={router} />
		</Providers>
	</StrictMode>,
);
