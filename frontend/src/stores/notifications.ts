import { toast } from "sonner";
export function showToast(message: string, kind: "info" | "positive" | "negative" = "info") {
	if (kind === "positive") toast.success(message);
	else if (kind === "negative") toast.error(message);
	else toast.info(message);
}
