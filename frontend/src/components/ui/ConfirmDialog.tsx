import { useTranslation } from "react-i18next";
import { useDialogStore } from "@/stores/dialog";
import { Button } from "./Button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./Dialog";
export function ConfirmDialog() {
	const { current, close } = useDialogStore();
	const { t } = useTranslation();
	return (
		<Dialog
			onOpenChange={open => {
				if (!open) close(false);
			}}
			open={!!current}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{current?.title || t("ui.notice")}</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<p>{current?.message}</p>
				</DialogBody>
				<DialogFooter>
					<Button onClick={() => close(true)}>{t("ui.ok")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
