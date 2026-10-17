import { createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { Fixture } from "./Fixture";
import "../../src/i18n/config";
import "../../src/globals.css";
const route = createRootRoute({ component: Fixture, notFoundComponent: () => null });
const router = createRouter({ routeTree: route });
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
