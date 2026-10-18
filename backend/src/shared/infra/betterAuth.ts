import { emailBranding } from "./branding";
import "@/env";
import { render } from "@react-email/components";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { ResetPasswordEmail } from "@/modules/users/emails";
import { AuthSecondaryStorage } from "./auth-secondary-storage";
import { mailer } from "./mail";
import { prisma } from "./sql";

const algorithm = "argon2id";

export const auth = betterAuth({
	basePath: "/auth",
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		password: {
			hash: password => Bun.password.hash(password, { algorithm }),
			verify: ({ hash, password }) => Bun.password.verify(password, hash, algorithm),
		},
		sendResetPassword: async ({ url, user }) => {
			const link = new URL("/auth/reset-password/", emailBranding.siteUrl || process.env.APP_URL);
			link.searchParams.set("token", new URL(url).searchParams.get("token") ?? "");
			url = link.href;
			await mailer.sendMail({
				from: `"${emailBranding.name.replaceAll(/['"\r\n]/g, "")}" <${process.env.MAIL_USER}>`,
				html: await render(ResetPasswordEmail({ name: user.name, url })),
				subject: "Redefinição de senha",
				text: `Olá, ${user.name}! Acesse o link para redefinir sua senha: ${url}. O link expira em 1 hora.`,
				to: user.email,
			});
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ url, user }) => {
			const link = new URL("/auth/verify-email/", emailBranding.siteUrl || process.env.APP_URL);
			link.searchParams.set("token", new URL(url).searchParams.get("token") ?? "");
			await mailer.sendMail({
				from: process.env.MAIL_USER || "template@localhost",
				subject: "Verify your email",
				text: link.href,
				to: user.email,
			});
		},
	},
	experimental: {
		joins: true,
	},
	secondaryStorage: new AuthSecondaryStorage(),
	session: { cookieCache: { enabled: false }, storeSessionInDatabase: true },
	trustedOrigins: process.env.CORS_WHITELIST!.split(","),
	user: { additionalFields: { role: { defaultValue: "user", input: false, type: "string" } } },
	verification: { storeInDatabase: true },
});
