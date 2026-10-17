import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionGroup } from "@/components/ui/ActionGroup";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authClient } from "@/lib/auth-client";

function ResetPasswordPage() {
	const { token } = Route.useSearch();
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [pending, setPending] = useState(false);
	const { t } = useTranslation();
	return (
		<form
			className="mx-auto grid max-w-md gap-4 p-6"
			onSubmit={async event => {
				event.preventDefault();
				const value = String(new FormData(event.currentTarget).get("password") ?? "");
				if (!token || value.length < 8) {
					setMessage(t("ui.required"));
					return;
				}
				setPending(true);
				try {
					const result = await authClient.resetPassword({ newPassword: value, token });
					setMessage(t(result.error ? "ui.failed" : "ui.done"));
				} catch {
					setMessage(t("ui.failed"));
				} finally {
					setPending(false);
				}
			}}
		>
			<h1>{t("ui.resetPassword")}</h1>
			<TextField
				autoComplete="new-password"
				label={t("ui.password")}
				minLength={8}
				name="password"
				onValueChange={setPassword}
				placeholder={t("ui.passwordPlaceholder")}
				required
				type="password"
				value={password}
			/>
			<p role="status">{message}</p>
			<ActionGroup>
				<Button disabled={pending}>{t("ui.save")}</Button>
			</ActionGroup>
		</form>
	);
}
export const Route = createFileRoute("/auth/reset-password/")({
	component: ResetPasswordPage,
	validateSearch: (search: Record<string, unknown>) => ({
		token: typeof search.token === "string" ? search.token : "",
	}),
});
