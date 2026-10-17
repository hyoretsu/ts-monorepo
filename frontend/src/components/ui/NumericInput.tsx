import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { Input } from "./Input";
export function NumericInput({ value, onValueChange, ...props }: NumericFormatProps) {
	const [local, setLocal, flush] = useDebouncedInput(String(value ?? ""), () => undefined);
	return (
		<NumericFormat
			{...props}
			customInput={Input}
			inputMode="decimal"
			onBlur={event => {
				flush();
				props.onBlur?.(event);
			}}
			onValueChange={(values, source) => {
				setLocal(values.formattedValue);
				onValueChange?.(values, source);
			}}
			type="text"
			value={local}
		/>
	);
}
