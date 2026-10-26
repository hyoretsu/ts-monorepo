import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { cn } from "@/lib/utils";
import { Input } from "./Input";
import { inputControlClassName } from "./input-styles";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { ScrollArea } from "./ScrollArea";
export interface SelectOption {
	label: string;
	value: string;
	special?: boolean;
	disabled?: boolean;
}
export interface SelectGroup {
	label: string;
	options: SelectOption[];
}
export function CustomSelect({
	options = [],
	groups,
	value,
	onChange,
	searchable = false,
	sortOptions = true,
	placeholder,
	className,
	disabled,
	name,
}: {
	options?: SelectOption[];
	groups?: SelectGroup[];
	value: string;
	onChange: (value: string) => void;
	searchable?: boolean;
	sortOptions?: boolean;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	name?: string;
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useDebouncedInput("", () => undefined);
	const id = useId();
	const { t } = useTranslation();
	const all = groups ? groups.flatMap(group => group.options) : options;
	useEffect(() => {
		const enabled = all.filter(option => !option.disabled);
		if (!disabled && enabled.length === 1 && !enabled.some(option => option.value === value))
			onChange(enabled[0].value);
	}, [all, disabled, onChange, value]);
	const regular = all.filter(
		option => !option.special && option.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
	);
	if (sortOptions) regular.sort((a, b) => a.label.localeCompare(b.label));
	const filtered = [...all.filter(option => option.special), ...regular];
	return (
		<>
			<input name={name} type="hidden" value={value} />
			<Popover
				onOpenChange={next => {
					setOpen(next);
					if (!next) setSearch("");
				}}
				open={open}
			>
				<PopoverTrigger asChild>
					<button
						aria-controls={id}
						aria-expanded={open}
						className={cn(
							inputControlClassName,
							"cursor-pointer justify-between gap-2 disabled:cursor-not-allowed",
							className,
						)}
						disabled={disabled}
						role="combobox"
						type="button"
					>
						<span className="truncate">
							{all.find(option => option.value === value)?.label ??
								placeholder ??
								t("ui.select")}
						</span>
						<LuChevronDown className="shrink-0" />
					</button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-48 p-2">
					{searchable && (
						<Input
							aria-label={t("ui.search")}
							onChange={event => setSearch(event.currentTarget.value)}
							placeholder={t("ui.search")}
							value={search}
						/>
					)}
					<ScrollArea className="h-56 min-h-0 shrink">
						<div className="grid gap-1 p-1" id={id} role="listbox">
							{filtered.map(option => (
								<button
									aria-selected={option.value === value}
									className="hover:bg-accent focus-visible:bg-accent cursor-pointer rounded border border-transparent p-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
									disabled={option.disabled}
									key={option.value}
									onClick={() => {
										onChange(option.value);
										setOpen(false);
									}}
									role="option"
									type="button"
								>
									{option.label}
								</button>
							))}
							{!filtered.length && (
								<p className="text-muted-foreground p-2">{t("ui.noResults")}</p>
							)}
						</div>
					</ScrollArea>
				</PopoverContent>
			</Popover>
		</>
	);
}
