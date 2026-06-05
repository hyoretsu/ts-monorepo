import { Heading, Hr, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailColors } from "./components";

interface ResetPasswordEmailProps {
	name: string;
	url: string;
}

export function ResetPasswordEmail({ name, url }: ResetPasswordEmailProps) {
	return (
		<EmailLayout preview="Redefina sua senha da Vivendo de Bet">
			<Heading
				style={{
					color: emailColors.foreground,
					fontSize: "22px",
					fontWeight: "700",
					margin: "0 0 8px",
				}}
			>
				Redefinição de senha
			</Heading>

			<Text
				style={{
					color: emailColors.foreground,
					fontSize: "15px",
					lineHeight: "1.6",
					margin: "0 0 24px",
				}}
			>
				Olá, {name}! Recebemos uma solicitação para redefinir a senha da sua conta.
			</Text>

			<EmailButton href={url}>Redefinir senha</EmailButton>

			<Text
				style={{
					color: emailColors.muted,
					fontSize: "13px",
					lineHeight: "1.5",
					margin: "24px 0 0",
				}}
			>
				O link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail — sua senha não será
				alterada.
			</Text>

			<Hr style={{ borderColor: emailColors.border, margin: "32px 0 24px" }} />

			<Text
				style={{
					color: emailColors.muted,
					fontSize: "12px",
					lineHeight: "1.5",
					margin: "0",
				}}
			>
				© {new Date().getFullYear()} Vivendo de Bet. Plataforma simulada de teste de aptidão.
			</Text>
		</EmailLayout>
	);
}
