export function normalizeExampleName(value: string): string {
	const name = value.trim();
	if (!name) throw new Error("EXAMPLE_NAME_REQUIRED");
	return name;
}
