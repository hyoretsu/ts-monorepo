import { Toaster } from "sonner";
import { useSyncSession } from "@/hooks/use-sync-session";
import { ConfirmDialog } from "./ui/ConfirmDialog";
export function AppServices() {
	useSyncSession();
	return (
		<>
			<ConfirmDialog />
			<Toaster richColors />
		</>
	);
}
