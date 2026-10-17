import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { Calendar } from "./Calendar";
import { inputControlClassName } from "./input-styles";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
export function DateRangePicker({
	value,
	onChange,
	label,
}: {
	value?: DateRange;
	onChange: (value: DateRange | undefined) => void;
	label: string;
}) {
	const { t } = useTranslation();
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					aria-label={label}
					className={`${inputControlClassName} cursor-pointer truncate`}
					type="button"
				>
					{value?.from
						? `${value.from.toLocaleDateString()} - ${value.to?.toLocaleDateString() ?? ""}`
						: t("ui.dateRangePlaceholder")}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar mode="range" onSelect={onChange} selected={value} />
			</PopoverContent>
		</Popover>
	);
}
