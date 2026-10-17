"use client";

import { cn } from "cn";
import { Separator as SeparatorPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

function Separator({
	className,
	orientation = "horizontal",
	decorative = true,
	...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) {
	return (
		<SeparatorPrimitive.Root
			className={cn(
				"shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px",
				className,
			)}
			data-slot="separator"
			decorative={decorative}
			orientation={orientation}
			{...props}
		/>
	);
}

export { Separator };
