import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const query = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const subscribe = (callback: () => void) => {
	const media = window.matchMedia(query);
	media.addEventListener("change", callback);
	return () => media.removeEventListener("change", callback);
};
const snapshot = () => window.matchMedia(query).matches;

export function Toaster(props: ToasterProps) {
	const { t } = useTranslation("common");
	const desktop = useSyncExternalStore(subscribe, snapshot, () => false);
	return (
		<Sonner
			{...props}
			closeButton={desktop}
			mobileOffset={{ left: "1rem", right: "1rem", top: "calc(1rem + env(safe-area-inset-top))" }}
			position="top-center"
			swipeDirections={["left", "right", "top"]}
			toastOptions={{ ...props.toastOptions, closeButtonAriaLabel: t("notifications.close") }}
			visibleToasts={5}
		/>
	);
}
