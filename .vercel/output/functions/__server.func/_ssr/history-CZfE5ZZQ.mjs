import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as useCurrentUser } from "./createSsrRpc-Dz_dOZX4.mjs";
import { a as exportHistory, h as requestDeleteAction, i as editLoggedAction } from "./server-CUMQ9RW2.mjs";
import { i as useInvalidatePaws, r as useHistory } from "./hooks-CpLbDQWU.mjs";
import { b as Download, n as Trash2 } from "../_libs/lucide-react.mjs";
import { n as downloadText, r as formatPoints } from "./utils-BjfSGPtc.mjs";
import { t as AppShell } from "./shell-B9dkO7jg.mjs";
import { t as Badge } from "./badge-CHNGciWB.mjs";
import { t as Button } from "./button-DfH4WwFg.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-TJS5GCD3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/history-CZfE5ZZQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HistoryPage() {
	const user = useCurrentUser();
	const [search, setSearch] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("");
	const history = useHistory({
		search: search || void 0,
		kind: kind || void 0,
		status: status || void 0
	}, Boolean(user));
	const invalidate = useInvalidatePaws();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Your story",
		subtitle: "Searchable shared history",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					placeholder: "Search notes, actions, tags…",
					value: search,
					onChange: (e) => setSearch(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: !kind ? "default" : "outline",
							onClick: () => setKind(""),
							children: "All kinds"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: kind === "positive" ? "default" : "outline",
							onClick: () => setKind("positive"),
							children: "Positive"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: kind === "negative" ? "default" : "outline",
							onClick: () => setKind("negative"),
							children: "Negative"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: status === "pending" ? "default" : "outline",
							onClick: () => setStatus(status === "pending" ? "" : "pending"),
							children: "Pending"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "secondary",
						onClick: async () => {
							const { csv } = await exportHistory();
							downloadText(`pawmise-history-${Date.now()}.csv`, csv);
							toast.success("Exported CSV");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-4 w-4" }), "Export CSV"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: async () => {
							const res = await requestDeleteAction({ data: { entry_type: "history_wipe" } });
							toast.message(res.status === "approved" ? "History wiped (both agreed)" : "Wipe requested — partner must agree");
							invalidate();
						},
						children: "Request full wipe"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 pb-4",
					children: [(history.data ?? []).map((a) => {
						const canEdit = user && a.logged_by === user.id && a.status !== "declined" && new Date(a.editable_until).getTime() > Date.now();
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-3xl border border-border bg-card p-4 shadow-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium leading-snug",
											children: a.action_name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-0.5 text-xs text-muted-foreground",
											children: [
												a.logger_name,
												" → ",
												a.applies_name,
												" · ",
												a.category,
												" ·",
												" ",
												new Date(a.created_at).toLocaleString()
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-end gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-sm font-semibold tabular ${a.points >= 0 ? "text-positive" : "text-danger"}`,
											children: formatPoints(a.points)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: a.status === "pending" ? "pending" : a.status === "declined" ? "negative" : "soft",
											children: a.status
										})]
									})]
								}),
								a.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted-foreground",
									children: a.note
								}) : null,
								a.attention_to_detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs font-medium text-primary",
									children: "Attention to Detail"
								}) : null,
								a.photo_data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: a.photo_data,
									alt: "",
									className: "mt-2 max-h-40 rounded-2xl object-cover"
								}) : null,
								a.decline_note ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-xs text-danger",
									children: ["Declined: ", a.decline_note]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex flex-wrap gap-2",
									children: [canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "secondary",
										onClick: async () => {
											const pts = window.prompt("Edit points", String(a.points));
											if (pts == null) return;
											try {
												await editLoggedAction({ data: {
													id: a.id,
													points: Number(pts)
												} });
												toast.success("Updated within 24h window");
												invalidate();
											} catch (e) {
												toast.error(e instanceof Error ? e.message : "Edit failed");
											}
										},
										children: "Edit (24h)"
									}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: async () => {
											const res = await requestDeleteAction({ data: {
												entry_type: "action",
												entry_id: a.id
											} });
											toast.message(res.status === "approved" ? "Deleted (both agreed)" : "Delete requested — partner must agree");
											invalidate();
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), "Request delete"]
									})]
								})
							]
						}, a.id);
					}), history.data?.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-8 text-center text-sm text-muted-foreground",
						children: "Your shared notebook is still blank — in a cozy way."
					}) : null]
				})
			]
		})
	});
}
//#endregion
export { HistoryPage as component };
