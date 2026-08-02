import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { l as PawPrint } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/loading-C5tbp5MK.js
var import_jsx_runtime = require_jsx_runtime();
/** High-contrast full-screen loading — never a blank cream page. */
function FullPageLoading({ message = "Opening your little world…" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-6 text-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-4 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-14 w-14 place-items-center rounded-3xl bg-primary/15 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PawPrint, { className: "h-7 w-7 animate-pulse" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-base font-medium text-foreground",
					children: message
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xs text-sm text-muted-foreground",
					children: "If this hangs more than a few seconds, reload the page."
				})
			]
		})
	});
}
//#endregion
export { FullPageLoading as t };
