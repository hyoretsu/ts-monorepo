import { isRedirect, redirect } from "@tanstack/react-router";
import { getAuthMe } from "@/lib/api";

export async function requireAdminBeforeLoad() {
	try {
		const result = await getAuthMe();
		if (!result?.user) {
			throw redirect({ to: "/login" });
		}
		if (result.user.role !== "ADMIN") {
			throw redirect({ to: "/" });
		}
	} catch (error) {
		if (isRedirect(error)) {
			throw error;
		}
		throw redirect({ to: "/login" });
	}
}
