import { t as cn } from "./utils-BjfSGPtc.mjs";
import { g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { S as CirclePlus, _ as Gift, h as History, l as PawPrint, m as House, o as Settings } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-B9dkO7jg.js
var import_jsx_runtime = require_jsx_runtime();
var tabs = [
	{
		to: "/app",
		label: "Home",
		icon: House,
		exact: true
	},
	{
		to: "/app/log",
		label: "Log",
		icon: CirclePlus
	},
	{
		to: "/app/history",
		label: "Story",
		icon: History
	},
	{
		to: "/app/rewards",
		label: "Treats",
		icon: Gift
	},
	{
		to: "/app/settings",
		label: "Nest",
		icon: Settings
	}
];
function AppShell({ children, title, subtitle }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "paw-bg mx-auto flex min-h-dvh w-full max-w-lg flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-border/60 bg-bg/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PawPrint, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
								children: "Pawmise"
							}),
							title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "truncate text-lg font-semibold tracking-tight",
								children: title
							}) : null,
							subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm text-muted-foreground",
								children: subtitle
							}) : null
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 overflow-x-hidden px-4 py-4",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "safe-pb sticky bottom-0 z-20 border-t border-border/60 bg-bg/95 px-2 pt-2 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-5 gap-1",
					children: tabs.map((tab) => {
						const active = tab.exact ? pathname === tab.to : pathname === tab.to || pathname.startsWith(`${tab.to}/`);
						const Icon = tab.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: tab.to,
							className: cn("flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-medium transition-colors", active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "h-5 w-5",
								strokeWidth: active ? 2.25 : 1.75
							}), tab.label]
						}) }, tab.to);
					})
				})
			})
		]
	});
}
//#endregion
export { AppShell as t };
