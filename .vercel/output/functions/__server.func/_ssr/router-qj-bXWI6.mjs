import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { c as HeadContent, d as createRouter, f as Outlet, h as createRootRoute, m as createFileRoute, p as lazyRouteComponent, s as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime, n as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { a as getSql, n as dbSource, o as isServerlessRuntime, t as MISSING_DATABASE_URL_MESSAGE } from "./db-BWLI4Tr_.mjs";
import { n as auth } from "./server-Duk20QHo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-qj-bXWI6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Top branding bar for deployed apps. Visibility is deploy-controlled via
* VITE_* env (inlined by Vite at build time). Defaults off.
*/
var BANNER_HEIGHT = "2.25rem";
var BANNER_HEIGHT_VAR = "--grok-banner-h";
function readEnv(key) {
	const fromVite = {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/",
		"VITE_DEV_SERVER_HOST": "0.0.0.0"
	}[key];
	if (fromVite !== void 0 && fromVite !== "") return fromVite;
}
function envFlag(key, defaultValue) {
	const raw = readEnv(key);
	if (raw === void 0) return defaultValue;
	const v = raw.trim().toLowerCase();
	if (v === "true" || v === "1" || v === "yes") return true;
	if (v === "false" || v === "0" || v === "no") return false;
	return defaultValue;
}
function RemixIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 14 14",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		className: "block size-3.5 shrink-0",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M2.85059 3.5C3.42171 3.49757 3.9879 3.74949 4.36816 4.17562C5.82851 5.79822 7.28852 7.42134 8.74886 9.04394C8.91014 9.22468 9.14982 9.3323 9.39201 9.33333C9.39445 9.33335 9.39697 9.33333 9.39941 9.33333C9.69335 9.33354 9.98729 9.34136 10.2812 9.35612L9.50423 8.5791L10.3291 7.75423L12.4915 9.91667L10.3291 12.0791L9.50423 11.2542L10.2812 10.4766C9.98728 10.4914 9.69336 10.4998 9.39941 10.5C9.39371 10.5 9.38802 10.5 9.38232 10.5C8.81697 10.4976 8.25832 10.2462 7.88184 9.82438C6.42149 8.20178 4.96148 6.57866 3.50114 4.95605C3.33823 4.77345 3.09529 4.66561 2.85059 4.66667H1.75V3.5H2.85059Z",
				fill: "#417CFF"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M5.53597 8.52612C5.14663 8.95882 4.75754 9.39174 4.36816 9.82438C3.9879 10.2505 3.42171 10.5024 2.85059 10.5H1.75V9.33333H2.85059C3.09529 9.33439 3.33823 9.22655 3.50114 9.04394C3.91804 8.58073 4.33469 8.11725 4.75155 7.65397L5.53597 8.52612Z",
				fill: "#417CFF"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M12.4915 4.08333L10.3291 6.24577L9.50423 5.4209L10.2801 4.64445C9.99185 4.65884 9.70361 4.66667 9.41536 4.66667H9.39941C9.15471 4.66561 8.91177 4.77346 8.74886 4.95605C8.33197 5.41926 7.91473 5.88219 7.49788 6.34546L6.71346 5.47331C7.10279 5.04063 7.49247 4.60825 7.88184 4.17562C8.2621 3.74949 8.8283 3.49757 9.39941 3.5H9.41536C9.7036 3.5 9.99186 3.50726 10.2801 3.52165L9.50423 2.74577L10.3291 1.9209L12.4915 4.08333Z",
				fill: "#417CFF"
			})
		]
	});
}
function CreatedWithGrokBanner() {
	const showBanner = envFlag("VITE_SHOW_BUILT_WITH_GROK", false);
	(0, import_react.useLayoutEffect)(() => {
		if (!showBanner || typeof document === "undefined") return;
		const root = document.documentElement;
		root.style.setProperty(BANNER_HEIGHT_VAR, BANNER_HEIGHT);
		return () => {
			root.style.removeProperty(BANNER_HEIGHT_VAR);
		};
	}, [showBanner]);
	if (!showBanner) return null;
	const projectId = (readEnv("VITE_PROJECT_ID") ?? "").trim();
	const showRemix = envFlag("VITE_ALLOW_FORKING", false) && projectId.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-9 w-full shrink-0",
		"aria-hidden": true
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed top-0 left-0 right-0 z-[100] flex h-9 w-full items-center justify-center gap-4 bg-black px-3 text-[13px] leading-none text-white/90",
		"data-created-with-grok-banner": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "https://grok.com?m=build",
				target: "_blank",
				rel: "noopener noreferrer",
				className: "absolute inset-0",
				"aria-label": "Created with Grok"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "relative z-10 pointer-events-none select-none font-medium tracking-tight text-white/80",
				children: "Created with Grok"
			}),
			showRemix ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: `https://grok.com/remix?projectId=${encodeURIComponent(projectId)}`,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "relative z-10 inline-flex h-6 items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-white/15",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RemixIcon, {}), "Remix"]
			}) : null
		]
	})] });
}
/**
* Registers a minimal service worker (installability only — no shell cache).
* Also recovers once from stale hashed chunks after a redeploy.
*/
function PwaRegister() {
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		const onPreloadError = (event) => {
			event.preventDefault();
			const key = "pawmise-chunk-reload";
			try {
				if (sessionStorage.getItem(key) === "1") return;
				sessionStorage.setItem(key, "1");
			} catch {}
			window.location.reload();
		};
		window.addEventListener("vite:preloadError", onPreloadError);
		const onUnhandled = (event) => {
			const msg = String(event.reason?.message ?? event.reason ?? "");
			if (!/Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) return;
			const key = "pawmise-chunk-reload";
			try {
				if (sessionStorage.getItem(key) === "1") return;
				sessionStorage.setItem(key, "1");
			} catch {}
			window.location.reload();
		};
		window.addEventListener("unhandledrejection", onUnhandled);
		if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").then((reg) => {
			reg.update();
		}).catch(() => {});
		return () => {
			window.removeEventListener("vite:preloadError", onPreloadError);
			window.removeEventListener("unhandledrejection", onUnhandled);
		};
	}, []);
	return null;
}
var styles_default = "/assets/styles-ZHntX7zZ.css";
var Route$11 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: "Pawmise — soft little paw-points for two" },
			{
				name: "description",
				content: "A private, playful notebook for couples to notice each other’s effort — brownie points with bulochka energy."
			},
			{
				name: "theme-color",
				content: "#b56b4a"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "default"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			},
			{
				rel: "icon",
				href: "/icons/icon-192.png",
				type: "image/png"
			},
			{
				rel: "apple-touch-icon",
				href: "/icons/icon-192.png"
			}
		]
	}),
	component: RootComponent
});
function RootComponent() {
	const [queryClient] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		retry: 1,
		refetchOnWindowFocus: true
	} } }));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RootDocument, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreatedWithGrokBanner, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PwaRegister, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "top-center",
				toastOptions: { className: "rounded-2xl border border-border bg-card text-foreground" }
			})
		] })
	}) });
}
function RootDocument({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "min-h-dvh bg-bg text-foreground antialiased",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					id: "pawmise-boot",
					className: "sr-only",
					children: "Pawmise is loading…"
				}),
				children,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$8 = () => import("./routes-BNURjzup.mjs");
var Route$10 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./app-D0pblIdN.mjs");
var Route$9 = createFileRoute("/app")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./login-BXOd9HnI.mjs");
var Route$8 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./onboarding-BDGeHlmT.mjs");
var Route$7 = createFileRoute("/onboarding")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
/**
* Deploy diagnostics. Healthy permanent app:
*   hasDatabaseUrl: true, dbSource: "neon", db: "up", tables include user+profiles,
*   hasBetterAuthUrl: true, hasAuthSecret: true
*/
var Route$6 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => {
	const serverless = isServerlessRuntime();
	const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
	const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim() || null;
	const result = {
		ok: true,
		dbSource,
		serverless,
		time: (/* @__PURE__ */ new Date()).toISOString(),
		hasDatabaseUrl,
		hasBetterAuthUrl: Boolean(betterAuthUrl),
		betterAuthUrl,
		hasGrokClient: Boolean(process.env.GROK_AUTH_CLIENT_ID?.trim()),
		hasAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET?.trim()),
		tip: "Use email sign-in on Vercel. Google needs Grok broker keys (hasGrokClient). Set BETTER_AUTH_URL to your exact https://….vercel.app URL (no trailing slash)."
	};
	if (!hasDatabaseUrl && serverless) {
		result.ok = false;
		result.db = "missing";
		result.dbError = MISSING_DATABASE_URL_MESSAGE;
		return json(result, 503);
	}
	try {
		const sql = await getSql();
		result.db = (await sql`select 1::int as n`)[0]?.n === 1 ? "up" : "unexpected";
		const tables = await sql`
            select table_name as name from information_schema.tables
            where table_schema = 'public'
              and table_name in (
                'user', 'session', 'verification', 'account',
                'profiles', 'couples', '_migrations'
              )
            order by table_name`;
		result.tables = tables.map((t) => t.name);
		result.migrations = (await sql`
            select name from _migrations order by name`.catch(() => [])).map((m) => m.name);
		if (!tables.some((t) => t.name === "user")) {
			result.ok = false;
			result.schemaError = "Auth tables missing after migrate. Redeploy with latest code, or check build logs for migrate errors.";
		}
		try {
			await sql`
              insert into "verification" ("id", "identifier", "value", "expiresAt", "createdAt", "updatedAt")
              values (
                ${"health_" + Date.now()},
                ${"health-check"},
                ${"ok"},
                ${new Date(Date.now() + 6e4).toISOString()}::timestamptz,
                now(),
                now()
              )`;
			await sql`delete from "verification" where "identifier" = 'health-check'`;
			result.verificationWrite = "ok";
		} catch (e) {
			result.verificationWrite = "fail";
			result.verificationError = e instanceof Error ? e.message : String(e);
			result.ok = false;
		}
	} catch (e) {
		result.ok = false;
		result.db = "down";
		result.dbError = e instanceof Error ? e.message : String(e);
	}
	if (!betterAuthUrl && serverless) {
		result.ok = false;
		result.authUrlError = "BETTER_AUTH_URL is not set. Set it to https://YOUR-APP.vercel.app (no trailing slash) and redeploy. Missing this causes OAuth state_mismatch / invalid redirect.";
	}
	return json(result, result.ok ? 200 : 503);
} } } });
function json(data, status) {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}
var $$splitComponentImporter$4 = () => import("./app-BbzutLYJ.mjs");
var Route$5 = createFileRoute("/app/")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./history-SVdJkkyy.mjs");
var Route$4 = createFileRoute("/app/history")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./log-D1fpM-j7.mjs");
var Route$3 = createFileRoute("/app/log")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./rewards-DhD96vXy.mjs");
var Route$2 = createFileRoute("/app/rewards")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./settings-CexA-Idp.mjs");
var Route$1 = createFileRoute("/app/settings")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
/**
* Better Auth catch-all. Wrapped so production 500s return a JSON body
* (empty 500s made Google sign-in look like a dead button / blank failure).
*/
async function handle({ request }) {
	try {
		const response = await auth.handler(request);
		if (response.status < 500) return response;
		const clone = response.clone();
		let text = "";
		try {
			text = await clone.text();
		} catch {
			text = "";
		}
		if (text && text.trim()) return response;
		return new Response(JSON.stringify({
			message: "Sign-in service hit a server error. Check database provisioning, then republish. (empty auth 500)",
			code: "AUTH_EMPTY_500",
			path: new URL(request.url).pathname
		}), {
			status: 500,
			headers: {
				"content-type": "application/json",
				"cache-control": "no-store"
			}
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error("[api/auth] handler threw:", err);
		return new Response(JSON.stringify({
			message: message || "Auth handler crashed",
			code: "AUTH_HANDLER_THROW"
		}), {
			status: 500,
			headers: {
				"content-type": "application/json",
				"cache-control": "no-store"
			}
		});
	}
}
var Route = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: handle,
	POST: handle
} } });
var IndexRoute = Route$10.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$11
});
var AppRoute = Route$9.update({
	id: "/app",
	path: "/app",
	getParentRoute: () => Route$11
});
var LoginRoute = Route$8.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$11
});
var OnboardingRoute = Route$7.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => Route$11
});
var ApiHealthRoute = Route$6.update({
	id: "/api/health",
	path: "/api/health",
	getParentRoute: () => Route$11
});
var AppIndexRoute = Route$5.update({
	id: "/",
	path: "/",
	getParentRoute: () => AppRoute
});
var AppHistoryRoute = Route$4.update({
	id: "/history",
	path: "/history",
	getParentRoute: () => AppRoute
});
var AppLogRoute = Route$3.update({
	id: "/log",
	path: "/log",
	getParentRoute: () => AppRoute
});
var AppRewardsRoute = Route$2.update({
	id: "/rewards",
	path: "/rewards",
	getParentRoute: () => AppRoute
});
var AppSettingsRoute = Route$1.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AppRoute
});
var ApiAuthSplatRoute = Route.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$11
});
var AppRouteChildren = {
	AppHistoryRoute,
	AppLogRoute,
	AppRewardsRoute,
	AppSettingsRoute,
	AppIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AppRoute: AppRoute._addFileChildren(AppRouteChildren),
	LoginRoute,
	OnboardingRoute,
	ApiHealthRoute,
	ApiAuthSplatRoute
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
function isChunkLoadError(error) {
	const msg = error instanceof Error ? error.message : String(error ?? "");
	return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(msg);
}
function AppErrorComponent({ error }) {
	const chunkFail = isChunkLoadError(error);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-danger",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: chunkFail ? "A fresh version is ready" : "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm leading-relaxed text-muted-foreground break-words",
				children: chunkFail ? "The published app was updated. Reload once to load the new files — this is normal after a redeploy." : error.message || "An unexpected error occurred. Try reloading the page."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "min-h-[44px] rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground",
				onClick: () => {
					try {
						sessionStorage.removeItem("pawmise-chunk-reload");
					} catch {}
					window.location.reload();
				},
				children: "Reload"
			})
		]
	});
}
function getRouter() {
	return createRouter({
		routeTree,
		defaultPreload: "intent",
		defaultErrorComponent: AppErrorComponent,
		scrollRestoration: true
	});
}
//#endregion
export { getRouter };
