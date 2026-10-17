import { format, isValid, parseISO } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "./Calendar";
import { inputControlClassName } from "./input-styles";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { RequiredMark } from "./RequiredMark";
export function DateField({
	value,
	onValueChange,
	label,
	name,
	required,
	disabled,
	min,
	max,
}: {
	value: string;
	onValueChange: (value: string) => void;
	label: string;
	name: string;
	required?: boolean;
	disabled?: boolean;
	min?: string;
	max?: string;
}) {
	const [open, setOpen] = useState(false);
	const { t } = useTranslation();
	const date = value ? parseISO(value) : undefined;
	return (
		<div className="grid min-w-0 gap-2">
			<span>
				{label} {required && <RequiredMark />}
			</span>
			<input name={name} type="hidden" value={value} />
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<button
						aria-label={label}
						className={`${inputControlClassName} cursor-pointer`}
						disabled={disabled}
						type="button"
					>
						{date && isValid(date) ? format(date, "MM/dd/yyyy") : t("ui.datePlaceholder")}
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<Calendar
						disabled={day =>
							!!((min && format(day, "yyyy-MM-dd") < min) || (max && format(day, "yyyy-MM-dd") > max))
						}
						mode="single"
						onSelect={day => {
							onValueChange(day ? format(day, "yyyy-MM-dd") : "");
							setOpen(false);
						}}
						selected={date && isValid(date) ? date : undefined}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
