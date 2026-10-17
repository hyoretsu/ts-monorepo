import { type Cookie, t } from "elysia";

export * from "./pagination";
export * from "./sorting";

export const Cookies = t.Cookie({});
export type Cookies = typeof Cookies.static;

export enum NodeEnv {
	Development = "development",
	Production = "production",
	Staging = "staging",
	Test = "test",
}

export type SetCookie = Cookie<unknown>["setCookie"];
