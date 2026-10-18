import { branding } from "../branding";
import type { GetExample200 } from "./generated/api/types/GetExample";
import type { PostExample200 } from "./generated/api/types/PostExample";
export type Example = PostExample200;
export type ExamplePage = GetExample200;
const base = branding.apiUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:3333";
export async function exampleRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${base}/example/${path}`, {
		...options,
		credentials: "include",
		headers: { "Content-Type": "application/json", ...options.headers },
	});
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	return response.json() as Promise<T>;
}
