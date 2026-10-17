import type { ComponentProps } from "react";
import { NumericInput } from "./NumericInput";
export function MoneyField(props: ComponentProps<typeof NumericInput>) {
	return (
		<NumericInput
			decimalScale={2}
			decimalSeparator="."
			fixedDecimalScale
			placeholder="$ 1,000.00"
			prefix="$ "
			thousandSeparator=","
			{...props}
		/>
	);
}
