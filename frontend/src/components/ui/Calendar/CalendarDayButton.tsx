import { cn } from "cn";
import { type ComponentProps, useEffect, useRef } from "react";
import { type DayButton, getDefaultClassNames } from "react-day-picker";
import { Button } from "@/components/ui/Button";

export function CalendarDayButton({ className, day, modifiers, ...props }: ComponentProps<typeof DayButton>) {
	const defaultClassNames = getDefaultClassNames();

	const ref = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (modifiers.focused) ref.current?.focus();
	}, [modifiers.focused]);

	return (
		<Button
			className={cn(
				"flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-start=true]:rounded-l-md data-[range-end=true]:bg-primary data-[range-middle=true]:bg-accent data-[range-start=true]:bg-primary data-[selected-single=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:text-accent-foreground data-[range-start=true]:text-primary-foreground data-[selected-single=true]:text-primary-foreground group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground [&>span]:text-xs [&>span]:opacity-70",
				defaultClassNames.day,
				className,
			)}
			data-day={day.date.toLocaleDateString()}
			data-range-end={modifiers.range_end}
			data-range-middle={modifiers.range_middle}
			data-range-start={modifiers.range_start}
			data-selected-single={
				modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
			}
			ref={ref}
			size="icon"
			variant="ghost"
			{...props}
		/>
	);
}
