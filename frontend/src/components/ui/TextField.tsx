import { type ComponentProps, type ReactNode, useId } from "react";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { Input } from "./Input";
import { RequiredMark } from "./RequiredMark";
export function TextField({
	value,
	onValueChange,
	label,
	caption,
	error,
	id,
	required,
	...props
}: Omit<ComponentProps<typeof Input>, "value" | "onChange"> & {
	value: string;
	onValueChange: (value: string) => void;
	label: ReactNode;
	caption?: ReactNode;
	error?: ReactNode;
}) {
	const generatedId = useId();
	const fieldId = id ?? generatedId;
	const [local, setLocal, flush] = useDebouncedInput(value, onValueChange);
	return (
		<div className="grid min-w-0 gap-2">
			<label htmlFor={fieldId}>
				<span>
					{label} {required && <RequiredMark />}
				</span>
			</label>
			<Input
				{...props}
				aria-describedby={error || caption ? `${fieldId}-help` : undefined}
				aria-invalid={!!error}
				id={fieldId}
				onBlur={event => {
					flush();
					props.onBlur?.(event);
				}}
				onChange={event => setLocal(event.currentTarget.value)}
				required={required}
				value={local}
			/>
			{(error || caption) && (
				<p
					className={error ? "text-destructive text-sm" : "text-muted-foreground text-sm"}
					id={`${fieldId}-help`}
					role={error ? "alert" : undefined}
				>
					{error || caption}
				</p>
			)}
		</div>
	);
}
