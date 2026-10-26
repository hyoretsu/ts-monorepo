import { useSyncSession } from "@/hooks/use-sync-session";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toaster } from "./ui/Sonner";
export function AppServices() {
	useSyncSession();
	return (
		<>
			<ConfirmDialog />
			<Toaster richColors />
		</>
	);
}
