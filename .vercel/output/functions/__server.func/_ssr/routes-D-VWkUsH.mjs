import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { r as useCurrentUserState } from "./createSsrRpc-Dz_dOZX4.mjs";
import { t as RedirectToSignIn } from "./gates-DVIy2uwz.mjs";
import { s as getMe } from "./server-CUMQ9RW2.mjs";
import { t as FullPageLoading } from "./loading-C5tbp5MK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D-VWkUsH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function IndexPage() {
	const { user, isPending } = useCurrentUserState();
	const [timedOut, setTimedOut] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = window.setTimeout(() => setTimedOut(true), 8e3);
		return () => window.clearTimeout(t);
	}, []);
	const me = useQuery({
		queryKey: ["me"],
		queryFn: () => getMe(),
		enabled: Boolean(user),
		retry: 1
	});
	if (isPending && timedOut) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FullPageLoading, { message: "Checking your soft session…" });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (me.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-sm space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold text-foreground",
					children: "Couldn’t load your nest"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: me.error instanceof Error ? me.error.message : "Please try again."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/login",
					className: "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground",
					children: "Back to sign-in"
				})
			]
		})
	});
	if (me.isLoading || !me.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FullPageLoading, { message: "Loading your shared little notebook…" });
	const step = me.data.profile.onboarding_step;
	const paired = Boolean(me.data.couple?.user_b);
	if (step !== "done" || !paired) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/onboarding" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/app" });
}
//#endregion
export { IndexPage as component };
