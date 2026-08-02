import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as useCurrentUser } from "./createSsrRpc-Dz_dOZX4.mjs";
import { C as upsertReward, n as claimReward, t as buyWishlistItem } from "./server-jk6IcsCn.mjs";
import { a as useRewards, i as useInvalidatePaws, n as useDashboard } from "./hooks-COJK7Nmh.mjs";
import { _ as Gift, a as ShoppingBag, c as Plus } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./shell-B9dkO7jg.mjs";
import { t as Badge } from "./badge-CHNGciWB.mjs";
import { t as Button } from "./button-DfH4WwFg.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-DsLDhHyG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Label, r as Textarea, t as Input } from "./input-TJS5GCD3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rewards-DhD96vXy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RewardsPage() {
	const user = useCurrentUser();
	const rewards = useRewards(Boolean(user));
	const dash = useDashboard(Boolean(user));
	const invalidate = useInvalidatePaws();
	const [showNew, setShowNew] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [desc, setDesc] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)("gesture");
	const mine = (0, import_react.useMemo)(() => (rewards.data ?? []).filter((r) => r.created_by === user?.id), [rewards.data, user?.id]);
	const theirs = (0, import_react.useMemo)(() => (rewards.data ?? []).filter((r) => r.created_by !== user?.id), [rewards.data, user?.id]);
	async function create() {
		if (!name.trim()) return;
		try {
			await upsertReward({ data: {
				name: name.trim(),
				description: desc.trim(),
				kind
			} });
			toast.success("Added to your soft list");
			setName("");
			setDesc("");
			setShowNew(false);
			invalidate();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Treats & wishes",
		subtitle: "Non-financial love currencies",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "flex items-center justify-between gap-3 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-wider text-muted-foreground",
						children: "Spendable paws"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl font-semibold tabular text-primary",
						children: dash.data?.balance.current ?? 0
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						onClick: () => setShowNew((v) => !v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "Add"]
					})]
				}) }),
				showNew ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "New reward or wishlist item"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "You create what you’d like to receive. Partner sets the paw-cost." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: kind === "gesture" ? "default" : "outline",
								onClick: () => setKind("gesture"),
								children: "Gesture"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: kind === "wishlist" ? "default" : "outline",
								onClick: () => setKind("wishlist"),
								children: "Wishlist buy-points"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: name,
								onChange: (e) => setName(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: desc,
								onChange: (e) => setDesc(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							onClick: () => void create(),
							children: "Save"
						})
					]
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "flex items-center gap-2 text-sm font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "h-4 w-4 text-primary" }), "Your wishlist (claim these)"]
						}),
						mine.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-3xl border border-border bg-card p-4 shadow-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-start justify-between gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: r.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: r.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											children: r.kind
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "soft",
											children: r.point_cost == null ? "Awaiting partner cost" : `${r.point_cost} paws`
										})]
									})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									disabled: r.point_cost == null,
									onClick: async () => {
										try {
											await claimReward({ data: { reward_id: r.id } });
											toast.success("Claimed — waiting for partner approval");
											invalidate();
										} catch (e) {
											toast.error(e instanceof Error ? e.message : "Claim failed");
										}
									},
									children: "Claim"
								})
							})]
						}, r.id)),
						mine.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Add a soft treat you’d love."
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-2 pb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "flex items-center gap-2 text-sm font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "h-4 w-4 text-primary" }), "Their list (set costs / buy wishlist)"]
					}), theirs.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl border border-border bg-card p-4 shadow-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: r.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: r.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: [
									"From ",
									r.created_by_name,
									" · ",
									r.kind
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									className: "w-24",
									placeholder: "Cost",
									defaultValue: r.point_cost ?? void 0,
									onBlur: async (e) => {
										const v = Number(e.target.value);
										if (!Number.isFinite(v)) return;
										try {
											await upsertReward({ data: {
												id: r.id,
												name: r.name,
												point_cost: v
											} });
											toast.success("Paw-cost set");
											invalidate();
										} catch (err) {
											toast.error(err instanceof Error ? err.message : "Failed");
										}
									}
								}), r.kind === "wishlist" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "secondary",
									disabled: r.point_cost == null,
									onClick: async () => {
										try {
											await buyWishlistItem({ data: { reward_id: r.id } });
											toast.success("Bought — you earned those paws");
											invalidate();
										} catch (e) {
											toast.error(e instanceof Error ? e.message : "Failed");
										}
									},
									children: "Buy & earn points"
								}) : null]
							})
						]
					}, r.id))]
				})
			]
		})
	});
}
//#endregion
export { RewardsPage as component };
