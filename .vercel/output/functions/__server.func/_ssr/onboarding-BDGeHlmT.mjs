import { o as __toESM } from "../_runtime.mjs";
import { t as cn } from "./utils-BjfSGPtc.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as Navigate, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { r as useCurrentUserState } from "./createSsrRpc-Dz_dOZX4.mjs";
import { c as joinWithCode, d as listMyPreferenceTargets, r as createInvite, s as getMe, v as savePreferences, x as updateProfile } from "./server-jk6IcsCn.mjs";
import { i as Sparkles, l as PawPrint, p as Link2, x as Copy } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DfH4WwFg.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-DsLDhHyG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as RedirectToSignIn } from "./gates-DVIy2uwz.mjs";
import { n as Label, r as Textarea, t as Input } from "./input-TJS5GCD3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-BDGeHlmT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OnboardingPage() {
	const { user, isPending } = useCurrentUserState();
	const nav = useNavigate();
	const me = useQuery({
		queryKey: ["me"],
		queryFn: () => getMe(),
		enabled: Boolean(user),
		refetchInterval: 3e3
	});
	const [step, setStep] = (0, import_react.useState)("profile");
	const [name, setName] = (0, import_react.useState)("");
	const [bio, setBio] = (0, import_react.useState)("");
	const [nickname, setNickname] = (0, import_react.useState)("");
	const [joinCode, setJoinCode] = (0, import_react.useState)("");
	const [invite, setInvite] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [ratings, setRatings] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		if (!me.data) return;
		setName(me.data.profile.display_name || me.data.authName || "");
		setBio(me.data.profile.bio || "");
		setNickname(me.data.profile.partner_nickname || "");
		const s = me.data.profile.onboarding_step;
		if (s === "preferences" || s === "pairing" || s === "profile") setStep(s);
		if (me.data.couple && !me.data.couple.user_b) {
			setInvite(me.data.couple.invite_code);
			setStep("pairing");
		}
		if (me.data.couple?.user_b && me.data.profile.onboarding_step === "done") nav({ to: "/app" });
	}, [me.data, nav]);
	const prefsQuery = useQuery({
		queryKey: ["pref-targets"],
		queryFn: () => listMyPreferenceTargets(),
		enabled: Boolean(user) && step === "preferences" && Boolean(me.data?.couple)
	});
	(0, import_react.useEffect)(() => {
		if (!prefsQuery.data) return;
		const init = {};
		for (const a of prefsQuery.data) init[a.id] = a.my_points ?? a.base_points;
		setRatings(init);
	}, [prefsQuery.data]);
	if (isPending || me.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-48 animate-pulse rounded-2xl bg-muted" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (me.data?.couple?.user_b && me.data.profile.onboarding_step === "done") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/app" });
	async function saveProfile() {
		setBusy(true);
		try {
			await updateProfile({ data: {
				display_name: name.trim() || "Little one",
				bio: bio.trim(),
				partner_nickname: nickname.trim(),
				onboarding_step: "pairing"
			} });
			setStep("pairing");
			await me.refetch();
			toast.success("Profile tucked in softly");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save");
		} finally {
			setBusy(false);
		}
	}
	async function makeInvite() {
		setBusy(true);
		try {
			const c = await createInvite();
			setInvite(c.invite_code);
			await updateProfile({ data: { onboarding_step: "preferences" } });
			toast.success("Invite ready — share with your person");
			await me.refetch();
			setStep("preferences");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not create invite");
		} finally {
			setBusy(false);
		}
	}
	async function join() {
		setBusy(true);
		try {
			await joinWithCode({ data: joinCode });
			toast.success("Paws linked — welcome to your shared little world");
			setStep("preferences");
			await me.refetch();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Join failed");
		} finally {
			setBusy(false);
		}
	}
	async function savePrefs() {
		setBusy(true);
		try {
			const payload = Object.entries(ratings).map(([action_type_id, preferred_points]) => ({
				action_type_id: Number(action_type_id),
				preferred_points
			}));
			if (payload.length) await savePreferences({ data: payload });
			await updateProfile({ data: { onboarding_step: "done" } });
			toast.success("Preferences saved — soft mode engaged");
			if (me.data?.couple?.user_b) nav({ to: "/app" });
			else {
				setStep("pairing");
				toast.message("Waiting for your person to join with the code");
			}
			await me.refetch();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save prefs");
		} finally {
			setBusy(false);
		}
	}
	const steps = (0, import_react.useMemo)(() => [
		{
			id: "profile",
			label: "You"
		},
		{
			id: "pairing",
			label: "Pair"
		},
		{
			id: "preferences",
			label: "Taste"
		}
	], []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "paw-bg mx-auto min-h-dvh w-full max-w-lg px-4 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PawPrint, { className: "h-5 w-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
					children: "Soft setup"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "Let’s set up your shared little world of brownie points"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-5 flex gap-2",
				children: steps.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-1.5 flex-1 rounded-full transition-colors", step === s.id || step === "preferences" && s.id !== "preferences" && me.data?.couple || step === "pairing" && s.id === "profile" ? "bg-primary" : "bg-muted") }, s.id))
			}),
			step === "profile" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Who are you, softie?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "A display name, a little bio, and what you call your person. Purely for the two of you." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "name",
							children: "Display name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "name",
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "e.g. Little Prince"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "nick",
							children: "Partner nickname"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "nick",
							value: nickname,
							onChange: (e) => setNickname(e.target.value),
							placeholder: "e.g. Bulochka"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "bio",
							children: "Short bio"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "bio",
							value: bio,
							onChange: (e) => setBio(e.target.value),
							placeholder: "Optional soft note about you…"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						disabled: busy,
						onClick: () => void saveProfile(),
						children: "Continue"
					})
				]
			})] }),
			step === "pairing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-4 w-4 text-primary" }), "Invite your person"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Create a private paw-code. Only one partner can join. Shared data stays between you two." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "space-y-3",
						children: invite ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-border bg-muted/50 p-4 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs uppercase tracking-wider text-muted-foreground",
									children: "Paw-code"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 font-mono text-3xl font-semibold tracking-[0.2em] text-primary",
									children: invite
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									className: "mt-3",
									onClick: async () => {
										await navigator.clipboard.writeText(invite);
										toast.success("Code copied");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), "Copy code"]
								}),
								!me.data?.couple?.user_b ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-muted-foreground",
									children: "Waiting for them to join… this page refreshes softly on its own."
								}) : null
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							disabled: busy,
							onClick: () => void makeInvite(),
							children: "Create invite code"
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Or join with a code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "If they already made the nest, hop in here." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: joinCode,
							onChange: (e) => setJoinCode(e.target.value.toUpperCase()),
							placeholder: "PAWXXXXX",
							className: "text-center font-mono tracking-widest"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "w-full",
							disabled: busy || joinCode.length < 6,
							onClick: () => void join(),
							children: "Join little world"
						})]
					})] }),
					me.data?.couple ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "w-full",
						onClick: () => setStep("preferences"),
						children: "Rate preferences next"
					}) : null
				]
			}),
			step === "preferences" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-primary" }), "What feels good to you?"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Your ratings shape the suggested scores when your partner logs things toward you. Changes only affect future logs." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4",
				children: [!me.data?.couple ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Create or join a pair first so we can seed your shared action list."
				}) : prefsQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 animate-pulse rounded-2xl bg-muted" }) : (prefsQuery.data ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl border border-border bg-surface p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium leading-snug",
							children: a.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground capitalize",
							children: [
								a.kind,
								" · default ",
								a.base_points > 0 ? `+${a.base_points}` : a.base_points
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							className: "w-20 text-center",
							value: ratings[a.id] ?? a.base_points,
							onChange: (e) => setRatings((r) => ({
								...r,
								[a.id]: Number(e.target.value)
							}))
						})]
					})
				}, a.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "w-full",
					disabled: busy || !me.data?.couple,
					onClick: () => void savePrefs(),
					children: "Save taste & continue"
				})]
			})] })
		]
	});
}
//#endregion
export { OnboardingPage as component };
