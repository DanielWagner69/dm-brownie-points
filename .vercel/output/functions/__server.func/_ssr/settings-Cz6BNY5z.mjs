import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { i as signOut } from "./client-B_pfiBS0.mjs";
import { n as useCurrentUser } from "./createSsrRpc-Dz_dOZX4.mjs";
import { S as upsertActionType, b as unpair, d as listMyPreferenceTargets, v as savePreferences, x as updateProfile } from "./server-CUMQ9RW2.mjs";
import { i as useInvalidatePaws, n as useDashboard } from "./hooks-CpLbDQWU.mjs";
import { d as LogOut, r as Sun, u as Moon, v as Flower2 } from "../_libs/lucide-react.mjs";
import { n as downloadText, t as cn } from "./utils-BjfSGPtc.mjs";
import { t as AppShell } from "./shell-B9dkO7jg.mjs";
import { t as Button } from "./button-DfH4WwFg.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-DsLDhHyG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Label, r as Textarea, t as Input } from "./input-TJS5GCD3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-Cz6BNY5z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const user = useCurrentUser();
	const dash = useDashboard(Boolean(user));
	const invalidate = useInvalidatePaws();
	const nav = useNavigate();
	const d = dash.data;
	const [name, setName] = (0, import_react.useState)("");
	const [bio, setBio] = (0, import_react.useState)("");
	const [nick, setNick] = (0, import_react.useState)("");
	const [prefs, setPrefs] = (0, import_react.useState)(d?.profile.notification_prefs);
	const [newAction, setNewAction] = (0, import_react.useState)("");
	const [newPoints, setNewPoints] = (0, import_react.useState)(1);
	const [newKind, setNewKind] = (0, import_react.useState)("positive");
	const prefTargets = useQuery({
		queryKey: ["pref-targets-settings"],
		queryFn: () => listMyPreferenceTargets(),
		enabled: Boolean(user)
	});
	const [ratings, setRatings] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		if (!d) return;
		setName(d.profile.display_name);
		setBio(d.profile.bio);
		setNick(d.profile.partner_nickname);
		setPrefs(d.profile.notification_prefs);
	}, [d]);
	(0, import_react.useEffect)(() => {
		if (!prefTargets.data) return;
		const init = {};
		for (const a of prefTargets.data) init[a.id] = a.my_points ?? a.base_points;
		setRatings(init);
	}, [prefTargets.data]);
	if (!d || !prefs) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Nest settings",
		subtitle: "Themes, taste, pairing",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 pb-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Profile"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Display name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: name,
								onChange: (e) => setName(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Partner nickname" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: nick,
								onChange: (e) => setNick(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Bio" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: bio,
								onChange: (e) => setBio(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: async () => {
								await updateProfile({ data: {
									display_name: name,
									bio,
									partner_nickname: nick
								} });
								toast.success("Profile updated");
								invalidate();
							},
							children: "Save profile"
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Theme"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Warm by default — dusk for late-night soft chats." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "grid grid-cols-3 gap-2",
					children: [
						{
							id: "warm",
							label: "Warm cream",
							icon: Sun
						},
						{
							id: "dusk",
							label: "Soft dusk",
							icon: Moon
						},
						{
							id: "blossom",
							label: "Blossom",
							icon: Flower2
						}
					].map((t) => {
						const Icon = t.icon;
						const active = d.profile.theme === t.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: async () => {
								await updateProfile({ data: { theme: t.id } });
								document.documentElement.setAttribute("data-theme", t.id);
								invalidate();
							},
							className: cn("flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-xs font-medium", active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" }), t.label]
						}, t.id);
					})
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Gentle pings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Choose which soft events show up in-app. Language stays in-character." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-2",
					children: [[
						["actions", "New actions logged"],
						["reviews", "Reviews & accepts"],
						["rewards", "Reward claims"],
						["summaries", "Weekly little letters"]
					].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-border px-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: prefs[key],
							onChange: (e) => setPrefs({
								...prefs,
								[key]: e.target.checked
							}),
							className: "h-5 w-5 accent-[var(--primary)]"
						})]
					}, key)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: async () => {
							await updateProfile({ data: { notification_prefs: prefs } });
							toast.success("Ping prefs saved");
							invalidate();
						},
						children: "Save ping prefs"
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Your preference ratings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Only affect future suggested scores when actions apply to you." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [(prefTargets.data ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "min-w-0 flex-1 truncate text-sm",
							children: a.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							className: "w-20",
							value: ratings[a.id] ?? a.base_points,
							onChange: (e) => setRatings((r) => ({
								...r,
								[a.id]: Number(e.target.value)
							}))
						})]
					}, a.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: async () => {
							await savePreferences({ data: Object.entries(ratings).map(([id, preferred_points]) => ({
								action_type_id: Number(id),
								preferred_points
							})) });
							toast.success("Taste updated");
						},
						children: "Save ratings"
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Custom action"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Add something unique to your pair, then archive later if needed." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Action name",
							value: newAction,
							onChange: (e) => setNewAction(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: newKind === "positive" ? "default" : "outline",
									onClick: () => setNewKind("positive"),
									children: "Positive"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: newKind === "negative" ? "default" : "outline",
									onClick: () => setNewKind("negative"),
									children: "Negative"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									className: "w-24",
									value: newPoints,
									onChange: (e) => setNewPoints(Number(e.target.value))
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: async () => {
								if (!newAction.trim()) return;
								await upsertActionType({ data: {
									name: newAction.trim(),
									kind: newKind,
									base_points: newKind === "negative" ? -Math.abs(newPoints) : Math.abs(newPoints)
								} });
								setNewAction("");
								toast.success("Action added");
								invalidate();
							},
							children: "Add action"
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Pairing"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: [
					"Code:",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono font-semibold text-primary",
						children: d.couple?.invite_code
					})
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "w-full",
						onClick: async () => {
							const exportFirst = window.confirm("Export your history as CSV before unpairing?");
							try {
								const res = await unpair({ data: { exportFirst } });
								if (res.exportCsv) downloadText(`pawmise-export-${Date.now()}.csv`, res.exportCsv);
								toast.message("Unpaired — shared data cleared");
								nav({ to: "/onboarding" });
							} catch (e) {
								toast.error(e instanceof Error ? e.message : "Unpair failed");
							}
						},
						children: "Unpair (export optional, then delete)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						className: "w-full",
						onClick: () => void signOut().then(() => nav({ to: "/login" })),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), "Sign out"]
					})]
				})] })
			]
		})
	});
}
//#endregion
export { SettingsPage as component };
