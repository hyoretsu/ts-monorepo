import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionGroup } from "@/components/ui/ActionGroup";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

function VerifyEmailPage() {
	const { token } = Route.useSearch();
	const { t } = useTranslation();
	const [message, setMessage] = useState("");
	const [pending, setPending] = useState(false);
	return (
		<div className="mx-auto grid max-w-md gap-4 p-6">
			<h1>{t("ui.verifyEmail")}</h1>
			<p role="status">{message}</p>
			<ActionGroup>
				<Button
					disabled={!token || pending}
					onClick={async () => {
						setPending(true);
						try {
							const result = await authClient.verifyEmail({ query: { token } });
							setMessage(t(result.error ? "ui.failed" : "ui.done"));
						} catch {
							setMessage(t("ui.failed"));
						} finally {
							setPending(false);
						}
					}}
				>
					{t("ui.verifyEmail")}
				</Button>
			</ActionGroup>
		</div>
	);
}
export const Route = createFileRoute("/auth/verify-email/")({
	component: VerifyEmailPage,
	validateSearch: (search: Record<string, unknown>) => ({
		token: typeof search.token === "string" ? search.token : "",
	}),
});
