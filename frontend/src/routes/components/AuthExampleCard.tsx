import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HiArrowRightOnRectangle, HiCheckCircle, HiLockClosed } from "react-icons/hi2";
import { ActionGroup } from "@/components/ui/ActionGroup";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RequiredMark } from "@/components/ui/RequiredMark";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores";
import { showToast } from "@/stores/notifications";

export function AuthExampleCard() {
	const { t } = useTranslation();
	const { clearError, error, isAuthenticated, isLoading, logout, signIn, user } = useAuthStore();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [registering, setRegistering] = useState(false);

	return (
		<Card>
			<CardHeader className="flex-row items-start gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
					<HiLockClosed className="h-5 w-5" />
				</div>
				<div className="space-y-1">
					<CardTitle>{t("home.auth.title")}</CardTitle>
					<CardDescription>{t("home.auth.description")}</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				{isAuthenticated && user ? (
					<div className="space-y-5">
						<div className="rounded-md border border-primary/30 bg-primary/10 p-4">
							<div className="flex items-center gap-2 font-medium text-primary">
								<HiCheckCircle className="h-5 w-5" />
								{t("home.auth.signedInAs", { name: user.name })}
							</div>
							<p className="mt-1 text-muted-foreground text-sm">{user.email}</p>
						</div>
						<Button onClick={logout} type="button" variant="outline">
							{t("home.auth.signOut")}
						</Button>
					</div>
				) : (
					<form
						className="space-y-4"
						onSubmit={async event => {
							event.preventDefault();
							const form = new FormData(event.currentTarget);
							const submittedEmail = String(form.get("email") ?? "").trim();
							const submittedPassword = String(form.get("password") ?? "");
							if (registering) {
								const result = await authClient.signUp.email({
									email: submittedEmail,
									name: t("auth.defaultUserName"),
									password: submittedPassword,
								});
								if (result.error) {
									showToast(result.error.message || t("ui.failed"), "negative");
									return;
								}
							}
							await signIn({
								defaultUserName: t("auth.defaultUserName"),
								email: submittedEmail,
								invalidCredentialsMessage: t("auth.errors.invalidCredentials"),
								password: submittedPassword,
							});
						}}
					>
						<Label>
							<span>
								{t("home.auth.emailLabel")} <RequiredMark />
							</span>
							<Input
								autoComplete="email"
								name="email"
								onChange={event => {
									setEmail(event.target.value);
									clearError();
								}}
								placeholder="demo@example.com"
								required
								type="email"
								value={email}
							/>
						</Label>
						<Label>
							<span>
								{t("home.auth.passwordLabel")} <RequiredMark />
							</span>
							<Input
								autoComplete={registering ? "new-password" : "current-password"}
								minLength={8}
								name="password"
								onChange={event => {
									setPassword(event.target.value);
									clearError();
								}}
								placeholder={t("ui.passwordPlaceholder")}
								required
								type="password"
								value={password}
							/>
						</Label>
						{error && <Alert className="text-destructive">{error}</Alert>}
						<ActionGroup>
							<Button onClick={() => setRegistering(value => !value)} type="button" variant="outline">
								{t(registering ? "home.auth.signIn" : "ui.register")}
							</Button>
							<Button disabled={isLoading} type="submit">
								{isLoading ? t("home.auth.signingIn") : t(registering ? "ui.register" : "home.auth.signIn")}
								<HiArrowRightOnRectangle className="h-5 w-5" />
							</Button>
						</ActionGroup>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
