import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Link2, LogOut, PawPrint, Sparkles } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";
import { useQuery } from "@tanstack/react-query";
import {
  createInvite,
  getMe,
  joinWithCode,
  listMyPreferenceTargets,
  savePreferences,
  updateProfile,
} from "@/lib/paws/server";
import { DEFAULT_ACTIONS, PREFERENCE_SAMPLES } from "@/lib/paws/defaults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PointsInput } from "@/components/ui/points-input";
import { cn } from "@/lib/utils";
import { FullPageLoading } from "@/components/paws/loading";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type StepId = "profile" | "preferences" | "pairing";

const PREF_SAMPLE_SET = new Set(PREFERENCE_SAMPLES);

function draftKey(userId: string) {
  return `pawmise-pref-draft-${userId}`;
}

function loadDraft(userId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveDraft(userId: string, ratings: Record<string, number>) {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(ratings));
  } catch {
    /* ignore */
  }
}

function clearDraft(userId: string) {
  try {
    localStorage.removeItem(draftKey(userId));
  } catch {
    /* ignore */
  }
}

function OnboardingPage() {
  const { user, isPending } = useCurrentUserState();
  const nav = useNavigate();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    enabled: Boolean(user),
    refetchInterval: 3000,
  });

  const [step, setStep] = useState<StepId>("profile");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [invite, setInvite] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Ratings keyed by action name (works before and after pairing). */
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const hydratedStep = useRef(false);
  const ratingsHydrated = useRef(false);

  // Profile → Preferences → Pairing
  const steps = useMemo(
    () =>
      [
        { id: "profile" as const, label: "You" },
        { id: "preferences" as const, label: "Taste" },
        { id: "pairing" as const, label: "Pair" },
      ] as const,
    [],
  );

  const stepOrder: StepId[] = ["profile", "preferences", "pairing"];

  const staticPrefItems = useMemo(
    () => DEFAULT_ACTIONS.filter((a) => PREF_SAMPLE_SET.has(a.name)),
    [],
  );

  useEffect(() => {
    if (!me.data) return;
    setName(me.data.profile.display_name || me.data.authName || "");
    setBio(me.data.profile.bio || "");
    setNickname(me.data.profile.partner_nickname || "");
    if (me.data.couple && !me.data.couple.user_b) {
      setInvite(me.data.couple.invite_code);
    }
    if (me.data.couple?.user_b && me.data.profile.onboarding_step === "done") {
      void nav({ to: "/app" });
      return;
    }
    if (!hydratedStep.current) {
      hydratedStep.current = true;
      const s = me.data.profile.onboarding_step;
      if (s === "preferences" || s === "pairing" || s === "profile") {
        setStep(s);
      } else if (me.data.couple && !me.data.couple.user_b) {
        // Host waiting for partner → pairing
        setStep("pairing");
      }
    }
  }, [me.data, nav]);

  const prefsQuery = useQuery({
    queryKey: ["pref-targets"],
    queryFn: () => listMyPreferenceTargets(),
    enabled: Boolean(user) && step === "preferences" && Boolean(me.data?.couple),
  });

  // Init ratings once: server prefs if couple, else static defaults + any local draft
  useEffect(() => {
    if (!user || ratingsHydrated.current) return;
    if (step !== "preferences") return;

    if (me.data?.couple) {
      if (!prefsQuery.data) return;
      const draft = loadDraft(user.id);
      const init: Record<string, number> = {};
      for (const a of prefsQuery.data) {
        init[a.name] = draft[a.name] ?? a.my_points ?? a.base_points;
      }
      setRatings(init);
      ratingsHydrated.current = true;
      return;
    }

    const draft = loadDraft(user.id);
    const init: Record<string, number> = {};
    for (const a of staticPrefItems) {
      init[a.name] = draft[a.name] ?? a.base_points;
    }
    setRatings(init);
    ratingsHydrated.current = true;
  }, [user, step, me.data?.couple, prefsQuery.data, staticPrefItems]);

  if (isPending || (Boolean(user) && me.isLoading && !me.data)) {
    return <FullPageLoading message="Opening soft setup…" />;
  }
  if (!user) return <RedirectToSignIn />;
  if (me.data?.couple?.user_b && me.data.profile.onboarding_step === "done") {
    return <Navigate to="/app" />;
  }

  const stepIndex = stepOrder.indexOf(step);

  function goBack() {
    if (step === "pairing") {
      setStep("preferences");
      return;
    }
    if (step === "preferences") {
      setStep("profile");
      return;
    }
  }

  function goToStep(target: StepId) {
    const targetIdx = stepOrder.indexOf(target);
    if (targetIdx <= stepIndex) setStep(target);
  }

  async function switchAccount() {
    try {
      await signOut();
      toast.message("Signed out — you can use a different email");
      void nav({ to: "/login" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign out");
    }
  }

  async function applyRatingsToCouple() {
    const targets = await listMyPreferenceTargets();
    const payload = targets
      .map((a) => {
        const preferred = ratings[a.name];
        if (preferred == null || !Number.isFinite(preferred)) return null;
        return { action_type_id: a.id, preferred_points: preferred };
      })
      .filter((x): x is { action_type_id: number; preferred_points: number } => x != null);
    if (payload.length) await savePreferences({ data: payload });
  }

  async function saveProfile() {
    setBusy(true);
    try {
      await updateProfile({
        data: {
          display_name: name.trim() || "Little one",
          bio: bio.trim(),
          partner_nickname: nickname.trim(),
          onboarding_step: "preferences",
        },
      });
      ratingsHydrated.current = false;
      setStep("preferences");
      await me.refetch();
      toast.success("Profile tucked in softly");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function savePrefs() {
    setBusy(true);
    try {
      if (user) saveDraft(user.id, ratings);
      if (me.data?.couple) {
        await applyRatingsToCouple();
      }
      await updateProfile({ data: { onboarding_step: "pairing" } });
      toast.success("Taste saved — next, link with your person");
      setStep("pairing");
      await me.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save prefs");
    } finally {
      setBusy(false);
    }
  }

  async function makeInvite() {
    setBusy(true);
    try {
      const c = await createInvite();
      setInvite(c.invite_code);
      // Apply any draft ratings now that couple + defaults exist
      try {
        await applyRatingsToCouple();
        if (user) clearDraft(user.id);
      } catch {
        /* draft apply is best-effort */
      }
      await updateProfile({ data: { onboarding_step: "pairing" } });
      toast.success("Invite ready — share with your person");
      await me.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create invite");
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    try {
      await joinWithCode({ data: joinCode.trim().toUpperCase() });
      try {
        await applyRatingsToCouple();
        if (user) clearDraft(user.id);
      } catch {
        /* best-effort */
      }
      await updateProfile({ data: { onboarding_step: "done" } });
      toast.success("Linked — welcome to your shared Brownie Points nest");
      await me.refetch();
      void nav({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Join failed");
    } finally {
      setBusy(false);
    }
  }

  const accountLabel = user.primaryEmail || user.displayName || "this account";

  const prefRows =
    me.data?.couple && prefsQuery.data && prefsQuery.data.length > 0
      ? prefsQuery.data.map((a) => ({
          key: a.name,
          name: a.name,
          kind: a.kind,
          base: a.base_points,
        }))
      : staticPrefItems.map((a) => ({
          key: a.name,
          name: a.name,
          kind: a.kind,
          base: a.base_points,
        }));

  return (
    <main className="paw-bg mx-auto min-h-dvh w-full max-w-lg px-4 py-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {step !== "profile" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={goBack}
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
              <PawPrint className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Soft setup
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Let’s set up your shared little world of Brownie Points
            </h1>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card/80 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Signed in as</p>
          <p className="truncate text-sm font-medium">{accountLabel}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => void switchAccount()}>
          <LogOut className="h-3.5 w-3.5" />
          Change account
        </Button>
      </div>

      <div className="mb-5 flex gap-2">
        {steps.map((s, i) => {
          const active = step === s.id;
          const reachable = i <= stepIndex;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!reachable}
              onClick={() => goToStep(s.id)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                active || reachable ? "bg-primary" : "bg-muted",
                reachable && !active ? "opacity-60 hover:opacity-100" : "",
                !reachable ? "cursor-default" : "cursor-pointer",
              )}
              aria-label={`Go to ${s.label}`}
              title={reachable ? s.label : undefined}
            />
          );
        })}
      </div>
      <p className="mb-4 text-center text-xs text-muted-foreground">
        Step {stepIndex + 1} of {steps.length}: {steps[stepIndex]?.label}
        {step !== "profile" ? " · Back anytime" : " · Wrong email? Change account above"}
      </p>

      {step === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Who are you, softie?</CardTitle>
            <CardDescription>
              A display name, a little bio, and what you call your person. Purely for the two of you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Little Prince"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nick">Partner nickname</Label>
              <Input
                id="nick"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Bulochka"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Short bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Optional soft note about you…"
              />
            </div>
            <Button className="w-full" disabled={busy} onClick={() => void saveProfile()}>
              Continue to taste
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => void switchAccount()}
            >
              Wrong account? Sign out and use another email
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "preferences" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              What feels good to you?
            </CardTitle>
            <CardDescription>
              Set how much each thing should be worth in Brownie Points for you. You can tweak these
              later. Pairing comes next.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {me.data?.couple && prefsQuery.isLoading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            ) : (
              prefRows.map((a) => (
                <div key={a.key} className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium leading-snug">{a.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {a.kind} · default {a.base > 0 ? `+${a.base}` : a.base}
                      </p>
                    </div>
                    <PointsInput
                      className="w-20"
                      value={ratings[a.name] ?? a.base}
                      onValueChange={(n) => setRatings((r) => ({ ...r, [a.name]: n }))}
                      aria-label={`Brownie Points for ${a.name}`}
                    />
                  </div>
                </div>
              ))
            )}
            <Button className="w-full" disabled={busy} onClick={() => void savePrefs()}>
              Save taste & continue to pairing
            </Button>
            <Button variant="outline" className="w-full" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to profile
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "pairing" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Invite your person
              </CardTitle>
              <CardDescription>
                Create a private invite code. Only one partner can join. Shared Brownie Points stay
                between you two.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invite ? (
                <div className="rounded-2xl border border-border bg-muted/50 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Invite code
                  </p>
                  <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.2em] text-primary">
                    {invite}
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={async () => {
                      await navigator.clipboard.writeText(invite);
                      toast.success("Code copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy code
                  </Button>
                  {!me.data?.couple?.user_b ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Waiting for them to join… this page refreshes softly on its own.
                    </p>
                  ) : null}
                </div>
              ) : (
                <Button className="w-full" disabled={busy} onClick={() => void makeInvite()}>
                  Create invite code
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Or join with a code</CardTitle>
              <CardDescription>If they already made the nest, hop in here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="PAWXXXXX"
                className="text-center font-mono tracking-widest"
                autoCapitalize="characters"
              />
              <Button
                variant="secondary"
                className="w-full"
                disabled={busy || joinCode.length < 6}
                onClick={() => void join()}
              >
                {busy ? "Linking…" : "Join little world"}
              </Button>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to taste
          </Button>
        </div>
      )}
    </main>
  );
}
