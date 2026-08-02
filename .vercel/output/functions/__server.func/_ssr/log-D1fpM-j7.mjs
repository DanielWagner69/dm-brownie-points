import { o as __toESM } from "../_runtime.mjs";
import { r as formatPoints, t as cn } from "./utils-BjfSGPtc.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as useCurrentUser } from "./createSsrRpc-Dz_dOZX4.mjs";
import { p as logAction } from "./server-jk6IcsCn.mjs";
import { i as useInvalidatePaws, n as useDashboard, t as useActionTypes } from "./hooks-COJK7Nmh.mjs";
import { C as Camera, s as Search } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./shell-B9dkO7jg.mjs";
import { t as Badge } from "./badge-CHNGciWB.mjs";
import { t as Button } from "./button-DfH4WwFg.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-DsLDhHyG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Label, r as Textarea, t as Input } from "./input-TJS5GCD3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/log-D1fpM-j7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LogPage() {
	const user = useCurrentUser();
	const dash = useDashboard(Boolean(user));
	const types = useActionTypes(Boolean(user));
	const invalidate = useInvalidatePaws();
	const [direction, setDirection] = (0, import_react.useState)("self");
	const [kind, setKind] = (0, import_react.useState)("all");
	const [search, setSearch] = (0, import_react.useState)("");
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)("");
	const [detail, setDetail] = (0, import_react.useState)(false);
	const [photo, setPhoto] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const partnerLabel = dash.data?.couple?.partner_name || dash.data?.profile.partner_nickname || "Partner";
	const filtered = (0, import_react.useMemo)(() => {
		let list = types.data ?? [];
		if (kind !== "all") list = list.filter((a) => a.kind === kind);
		if (search.trim()) {
			const s = search.toLowerCase();
			list = list.filter((a) => a.name.toLowerCase().includes(s) || a.category.toLowerCase().includes(s));
		}
		return list;
	}, [
		types.data,
		kind,
		search
	]);
	const suggested = selected ? (selected.preferred_points ?? selected.base_points) + (detail && selected.kind === "positive" ? 2 : 0) : 0;
	async function submit() {
		if (!selected) return;
		setBusy(true);
		try {
			await logAction({ data: {
				action_type_id: selected.id,
				direction,
				note,
				photo_data: photo,
				attention_to_detail: detail
			} });
			toast.success("Logged with soft paws");
			setSelected(null);
			setNote("");
			setDetail(false);
			setPhoto(null);
			invalidate();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not log");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Log a paw",
		subtitle: "Notice something small and kind",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Who is this about?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Be clear — this choice decides whose balance the points land on." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setDirection("self"),
						className: cn("min-h-[72px] rounded-2xl border px-3 py-3 text-left transition-colors", direction === "self" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-surface text-muted-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-foreground",
							children: "What I did"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs leading-snug",
							children: [
								"Points apply to ",
								direction === "self" ? "you" : "you",
								" after partner review"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setDirection("partner"),
						className: cn("min-h-[72px] rounded-2xl border px-3 py-3 text-left transition-colors", direction === "partner" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-surface text-muted-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-semibold text-foreground",
							children: [
								"What ",
								partnerLabel,
								" did"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs leading-snug",
							children: ["Points apply to ", partnerLabel]
						})]
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "pl-9",
						placeholder: "Search actions…",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2",
					children: [
						"all",
						"positive",
						"negative"
					].map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: kind === k ? "default" : "outline",
						onClick: () => setKind(k),
						className: "capitalize",
						children: k
					}, k))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: filtered.map((a) => {
						const pts = a.preferred_points ?? a.base_points;
						const active = selected?.id === a.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSelected(a),
							className: cn("flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors", active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium leading-snug",
									children: a.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-xs capitalize text-muted-foreground",
									children: a.category
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: a.kind === "positive" ? "positive" : "negative",
								children: formatPoints(pts)
							})]
						}, a.id);
					})
				}),
				selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "sticky bottom-24 z-10 border-primary/30 shadow-lg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-base",
						children: selected.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: [
						"Suggested ",
						formatPoints(suggested),
						detail && selected.kind === "positive" ? " (includes Attention to Detail +2)" : ""
					] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-3",
						children: [
							selected.kind === "positive" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex min-h-[44px] items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: detail,
									onChange: (e) => setDetail(e.target.checked),
									className: "h-5 w-5 accent-[var(--primary)]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-medium",
									children: "Attention to Detail"
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "note",
									children: "Little note"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									id: "note",
									value: note,
									onChange: (e) => setNote(e.target.value),
									placeholder: "Optional soft context…"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-4 w-4" }),
										"Photo",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											accept: "image/*",
											capture: "environment",
											className: "hidden",
											onChange: (e) => {
												const file = e.target.files?.[0];
												if (!file) return;
												if (file.size > 28e4) {
													toast.error("Keep photos under ~280KB for now");
													return;
												}
												const reader = new FileReader();
												reader.onload = () => setPhoto(String(reader.result));
												reader.readAsDataURL(file);
											}
										})
									]
								}), photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: photo,
									alt: "",
									className: "h-11 w-11 rounded-xl object-cover"
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "w-full",
								disabled: busy,
								onClick: () => void submit(),
								children: ["Log · ", direction === "self" ? "What I did" : `What ${partnerLabel} did`]
							})
						]
					})]
				}) : null
			]
		})
	});
}
//#endregion
export { LogPage as component };
