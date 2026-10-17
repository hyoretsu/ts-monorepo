import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppServices } from "@/components/AppServices";

function RootComponent() {
	return (
		<div className="dark min-h-screen bg-background text-foreground">
			<AppServices />
			<main>
				<Outlet />
			</main>
		</div>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
});
