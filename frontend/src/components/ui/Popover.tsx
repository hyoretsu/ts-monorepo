"use client";

import { cn } from "cn";
import { Popover as PopoverPrimitive } from "radix-ui";
import { type ComponentProps, useContext } from "react";
import { usePopupViewportShift } from "@/hooks/use-popup-viewport-shift";
import { PopupLayerContext } from "./popup-layer-context";

function Popover({ ...props }: ComponentProps<typeof PopoverPrimitive.Root>) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: ComponentProps<typeof PopoverPrimitive.Trigger>) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
	className,
	style,
	align = "center",
	sideOffset = 4,
	ref,
	...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
	const layer = useContext(PopupLayerContext);
	const popupRef = usePopupViewportShift();
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				align={align}
				className={cn(
					"data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 bg-popover text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-2 overflow-hidden rounded-md border p-4 shadow-md outline-hidden",
					className,
				)}
				data-slot="popover-content"
				ref={node => {
					popupRef(node);
					if (typeof ref === "function") return ref(node);
					if (ref) ref.current = node;
				}}
				sideOffset={sideOffset}
				style={{
					zIndex: layer + 1,
					...style,
					maxHeight: "var(--popup-viewport-height, calc(100dvh - 2rem))",
				}}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

function PopoverAnchor({ ...props }: ComponentProps<typeof PopoverPrimitive.Anchor>) {
	return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverHeader({ className, ...props }: ComponentProps<"div">) {
	return (
		<div className={cn("flex flex-col gap-1 text-sm", className)} data-slot="popover-header" {...props} />
	);
}

function PopoverTitle({ className, ...props }: ComponentProps<"h2">) {
	return <div className={cn("font-medium", className)} data-slot="popover-title" {...props} />;
}

function PopoverDescription({ className, ...props }: ComponentProps<"p">) {
	return (
		<p className={cn("text-muted-foreground", className)} data-slot="popover-description" {...props} />
	);
}

export {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
};
