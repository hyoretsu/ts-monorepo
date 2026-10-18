import type { AnyRouter } from "@tanstack/react-router";
import { isTauri } from "@tauri-apps/api/core";
import { branding } from "./branding";
export function parseAuthDeepLink(raw: string) {
	try {
		const url = new URL(raw);
		const expected = branding.siteUrl ?? import.meta.env.VITE_APP_URL ?? "http://localhost:5173";
		const protocol = import.meta.env.VITE_APP_SCHEME ?? "template";
		if (url.protocol !== `${protocol}:` && url.origin !== new URL(expected).origin) return null;
		const path = url.protocol === `${protocol}:` ? `/${url.hostname}${url.pathname}` : url.pathname;
		const token = url.searchParams.get("token")?.trim();
		return token && ["/auth/reset-password", "/auth/verify-email"].includes(path.replace(/\/$/, ""))
			? { to: `${path.replace(/\/$/, "")}/`, token }
			: null;
	} catch {
		return null;
	}
}
export async function initializeDeepLinks(router: AnyRouter) {
	if (!isTauri()) return;
	const { getCurrent, onOpenUrl } = await import("@tauri-apps/plugin-deep-link");
	const navigate = (url: string) => {
		const link = parseAuthDeepLink(url);
		if (link) void router.navigate({ search: { token: link.token }, to: link.to });
	};
	(await getCurrent())?.forEach(navigate);
	await onOpenUrl(urls => urls.forEach(navigate));
}
