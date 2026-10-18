import { appendFileSync } from "node:fs";

/** Workflow selection is a newline-separated list, never CSV or shell fragments. */
export function parseVariants(value: string | undefined) {
	const slugs = [
		...new Set(
			(value ?? "")
				.split(/\r?\n/)
				.map(slug => slug.trim())
				.filter(Boolean),
		),
	];
	for (const slug of slugs) {
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
			throw new Error(`Invalid variant slug: ${JSON.stringify(slug)}`);
		}
	}
	return (slugs.length ? slugs : [""]).map(slug => ({ slug, suffix: slug ? `-${slug}` : "" }));
}

if (import.meta.main) {
	const variants = JSON.stringify(parseVariants(process.env.VARIANTS));
	if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `variants=${variants}\n`);
	else console.info(variants);
}
