import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as useCurrentUser } from "./createSsrRpc-Dz_dOZX4.mjs";
import { _ as reviewAction, g as resolveClaim, m as markNotificationsRead } from "./server-CUMQ9RW2.mjs";
import { i as useInvalidatePaws, n as useDashboard } from "./hooks-CpLbDQWU.mjs";
import { T as Award, g as HeartHandshake, i as Sparkles, l as PawPrint, w as Bell, y as Flame } from "../_libs/lucide-react.mjs";
import { r as formatPoints } from "./utils-BjfSGPtc.mjs";
import { t as AppShell } from "./shell-B9dkO7jg.mjs";
import { t as Badge } from "./badge-CHNGciWB.mjs";
import { t as Button } from "./button-DfH4WwFg.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-DsLDhHyG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-ix3XVJMR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HomePage() {
	const user = useCurrentUser();
	const dash = useDashboard(Boolean(user));
	const invalidate = useInvalidatePaws();
	const d = dash.data;
	(0, import_react.useEffect)(() => {
		if (d?.notifications.some((n) => !n.read)) markNotificationsRead().then(() => invalidate());
	}, [d?.notifications, invalidate]);
	if (!d) return null;
	const partnerLabel = d.couple?.partner_name || d.profile.partner_nickname || "your person";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: `Hey ${d.profile.display_name}`,
		subtitle: `Soft notes with ${partnerLabel}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "relative p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
									children: "Your care balance"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `mt-1 text-4xl font-semibold tracking-tight tabular ${d.balance.current >= 0 ? "text-positive" : "text-danger"}`,
									children: formatPoints(d.balance.current)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: [
										"Warmth ",
										formatPoints(d.balance.lifetime_positive),
										" · Oopsies",
										" ",
										d.balance.lifetime_negative,
										" · Spent ",
										d.balance.points_spent
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-primary/10 px-3 py-2 text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "mx-auto h-5 w-5 text-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-lg font-semibold tabular",
										children: d.streak
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted-foreground",
										children: "day streak"
									})
								]
							})]
						}), d.partnerBalance ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 rounded-2xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground",
							children: [
								partnerLabel,
								" sits at",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground tabular",
									children: formatPoints(d.partnerBalance.current)
								}),
								" ",
								"paws — not a scoreboard, just a soft mirror."
							]
						}) : null]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "flex items-center gap-2 text-base",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-primary" }), "This week’s little letter"]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-muted-foreground",
					children: d.weeklySummary
				}) })] }),
				d.pendingReviews.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Waiting for your soft review"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "48h to accept, tweak, or gently decline." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-3",
					children: d.pendingReviews.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-surface p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: a.action_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										a.direction === "self" ? "They did" : "You did",
										" ·",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular",
											children: formatPoints(a.points)
										})
									]
								}),
								a.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: a.note
								}) : null
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: a.kind === "positive" ? "positive" : "negative",
								children: a.kind
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									onClick: async () => {
										try {
											await reviewAction({ data: {
												id: a.id,
												decision: "accept"
											} });
											toast.success("Accepted with love");
											invalidate();
										} catch (e) {
											toast.error(e instanceof Error ? e.message : "Failed");
										}
									},
									children: "Accept"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "secondary",
									onClick: async () => {
										const pts = window.prompt("New points?", String(a.points));
										if (pts == null) return;
										try {
											await reviewAction({ data: {
												id: a.id,
												decision: "modify",
												points: Number(pts)
											} });
											toast.success("Tweaked gently");
											invalidate();
										} catch (e) {
											toast.error(e instanceof Error ? e.message : "Failed");
										}
									},
									children: "Modify"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									onClick: async () => {
										const note = window.prompt("A gentle note for declining?");
										if (!note?.trim()) return;
										try {
											await reviewAction({ data: {
												id: a.id,
												decision: "decline",
												decline_note: note
											} });
											toast.message("Declined and archived");
											invalidate();
										} catch (e) {
											toast.error(e instanceof Error ? e.message : "Failed");
										}
									},
									children: "Decline"
								})
							]
						})]
					}, a.id))
				})] }) : null,
				d.pendingClaims.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Reward claims to approve"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-3",
					children: d.pendingClaims.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: c.reward_name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								c.claimer_name,
								" · ",
								c.points_spent,
								" paws"
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: async () => {
									await resolveClaim({ data: {
										id: c.id,
										decision: "approve"
									} });
									toast.success("Reward approved");
									invalidate();
								},
								children: "Approve"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								onClick: async () => {
									await resolveClaim({ data: {
										id: c.id,
										decision: "cancel"
									} });
									toast.message("Cancelled & refunded");
									invalidate();
								},
								children: "Cancel"
							})]
						})]
					}, c.id))
				})] }) : null,
				d.badges.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "flex items-center gap-2 text-base",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "h-4 w-4 text-primary" }), "Soft badges"]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "flex flex-wrap gap-2",
					children: d.badges.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "soft",
						className: "px-3 py-1.5",
						children: b.title
					}, b.badge_key))
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "flex-row items-center justify-between space-y-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-base",
						children: "Recent paws"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "sm",
						variant: "ghost",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/app/history",
							children: "Full story"
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-2",
					children: d.recent.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Nothing logged yet. Go leave a little pawprint."
					}) : d.recent.slice(0, 6).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2 rounded-2xl bg-muted/40 px-3 py-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-medium",
								children: a.action_name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									a.logger_name,
									" · ",
									a.status
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `shrink-0 text-sm font-semibold tabular ${a.points >= 0 ? "text-positive" : "text-danger"}`,
							children: formatPoints(a.points)
						})]
					}, a.id))
				})] }),
				d.notifications.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "flex items-center gap-2 text-base",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4 text-primary" }), "Soft pings"]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "space-y-2",
					children: d.notifications.slice(0, 5).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border/70 px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: n.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: n.body
						})]
					}, n.id))
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3 pb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						className: "h-14",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/app/log",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PawPrint, { className: "h-4 w-4" }), "Log a paw"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "secondary",
						className: "h-14",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/app/rewards",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartHandshake, { className: "h-4 w-4" }), "Treats"]
						})
					})]
				})
			]
		})
	});
}
//#endregion
export { HomePage as component };
