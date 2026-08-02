import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { i as createServerFn } from "./ssr.mjs";
import { r as signIn } from "./client-B_pfiBS0.mjs";
import { r as useCurrentUserState, t as createSsrRpc } from "./createSsrRpc-Dz_dOZX4.mjs";
import { f as LoaderCircle, l as PawPrint, t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as FullPageLoading } from "./loading-C5tbp5MK.mjs";
import { t as Button } from "./button-DfH4WwFg.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-DsLDhHyG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as GROK_PROVIDERS } from "./server-D6u5cCP7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-DqQMjAXm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Client-safe deploy health for the login screen. */
var getDeployStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("d347aaeeb82d29969007741f7e1b31b26a2214aaedf9ede5a96bc54cdbe173e6"));
function LoginPage() {
	const { user, isPending } = useCurrentUserState();
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [lastError, setLastError] = (0, import_react.useState)(null);
	const deploy = useQuery({
		queryKey: ["deploy-status"],
		queryFn: () => getDeployStatus(),
		staleTime: 3e4
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FullPageLoading, { message: "Checking if you’re already signed in…" });
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	async function handleSignIn(providerId, label) {
		if (deploy.data?.needsDatabase) {
			const msg = deploy.data.message ?? "Database is not configured on this publish.";
			setLastError(msg);
			toast.error("Can’t sign in until a database is attached");
			return;
		}
		setBusy(providerId);
		setLastError(null);
		try {
			await signIn(providerId, {
				callbackURL: "/",
				errorCallbackURL: "/login"
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : `Could not start ${label} sign-in. Please try again.`;
			setLastError(msg);
			toast.error(msg);
		} finally {
			setBusy(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "paw-bg grid min-h-dvh place-items-center p-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "w-full max-w-sm border-border/80 shadow-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
				className: "items-center text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 grid h-14 w-14 place-items-center rounded-3xl bg-primary/15 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PawPrint, { className: "h-7 w-7" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-2xl tracking-tight",
						children: "Welcome to Pawmise"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
						className: "text-base leading-relaxed",
						children: "A private little world of brownie points for two. Soft accountability, zero therapy vibes — just noticing each other’s effort."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "flex flex-col gap-3",
				children: [
					deploy.data?.needsDatabase ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "alert",
						className: "rounded-2xl border border-danger/35 bg-danger/10 px-3 py-3 text-left text-xs leading-relaxed text-danger",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-1 flex items-center gap-1.5 font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3.5 w-3.5" }), "Database missing on this publish"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-danger/90",
								children: deploy.data.message
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-[11px] text-danger/80",
								children: [
									"Check",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "underline underline-offset-2",
										href: "/api/health",
										children: "/api/health"
									}),
									". You want ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: "rounded bg-danger/10 px-1",
										children: "hasDatabaseUrl: true"
									}),
									"."
								]
							})
						]
					}) : null,
					GROK_PROVIDERS.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: i === 0 ? "default" : "outline",
						className: "w-full",
						disabled: busy !== null || deploy.data?.needsDatabase === true,
						onClick: () => void handleSignIn(p.providerId, p.label),
						children: busy === p.providerId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Connecting…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Continue with ", p.label] })
					}, p.providerId)),
					lastError && !deploy.data?.needsDatabase ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-left text-xs leading-relaxed text-danger",
						children: lastError
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-1 text-center text-xs leading-relaxed text-muted-foreground",
						children: "Only you and your person will ever see your shared notebook. One couple. Private paws."
					})
				]
			})]
		})
	});
}
//#endregion
export { LoginPage as component };
