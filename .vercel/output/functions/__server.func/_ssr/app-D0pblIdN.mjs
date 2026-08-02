import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { f as Outlet, v as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { r as useCurrentUserState } from "./createSsrRpc-Dz_dOZX4.mjs";
import { n as useDashboard } from "./hooks-COJK7Nmh.mjs";
import { t as RedirectToSignIn } from "./gates-DVIy2uwz.mjs";
import { t as FullPageLoading } from "./loading-C5tbp5MK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-D0pblIdN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppLayout() {
	const { user, isPending } = useCurrentUserState();
	const dash = useDashboard(Boolean(user));
	(0, import_react.useEffect)(() => {
		const theme = dash.data?.profile.theme ?? "warm";
		document.documentElement.setAttribute("data-theme", theme);
	}, [dash.data?.profile.theme]);
	if (isPending || dash.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FullPageLoading, { message: "Warming up your shared nest…" });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (dash.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-sm space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold",
					children: "Couldn’t open the nest"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: dash.error instanceof Error ? dash.error.message : "Try reloading."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-[44px] rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground",
					onClick: () => window.location.reload(),
					children: "Reload"
				})
			]
		})
	});
	if (!dash.data?.couple?.is_complete) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/onboarding" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
}
//#endregion
export { AppLayout as component };
