import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
export function AppButton({
	tone = "default",
	fullWidth,
	className,
	...props
}: ComponentProps<typeof Button> & {
	tone?: "default" | "destructive" | "secondary" | "tertiary";
	fullWidth?: boolean;
}) {
	return (
		<Button
			{...props}
			className={cn(fullWidth && "w-full", className)}
			variant={tone === "tertiary" || tone === "secondary" ? "outline" : tone}
		/>
	);
}
