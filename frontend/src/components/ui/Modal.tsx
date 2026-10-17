import type { ReactNode } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
export function Modal({
	isOpen,
	onClose,
	title,
	children,
	maxWidth = "640px",
}: {
	isOpen: boolean;
	onClose: () => void;
	title: ReactNode;
	children: ReactNode;
	maxWidth?: string;
}) {
	return (
		<Dialog
			onOpenChange={open => {
				if (!open) onClose();
			}}
			open={isOpen}
		>
			<DialogContent style={{ maxWidth }}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<DialogBody>{children}</DialogBody>
			</DialogContent>
		</Dialog>
	);
}
