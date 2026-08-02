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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FullPageLoading } from "@/components/paws/loading";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type StepId = "profile" | "pairing" | "preferences";

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
  const [ratings, setRatings] = useState<Record<number, number>>({});
  /** After first hydrate from server, don’t force-step on every poll (allows Back). */
  const hydratedStep = useRef(false);

  const steps = useMemo(
    () =>
      [
        { id: "profile" as const, label: "You" },
        { id: "pairing" as const, label: "Pair" },
        { id: "preferences" as const, label: "Taste" },
      ] as const,
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
        setStep("pairing");
      }
    }
  }, [me.data, nav]);

  const prefsQuery = useQuery({
    queryKey: ["pref-targets"],
    queryFn: () => listMyPreferenceTargets(),
    enabled: Boolean(user) && step === "preferences" && Boolean(me.data?.couple),
  });

  useEffect(() => {
    if (!prefsQuery.data) return;
    const init: Record<number, number> = {};
    for (const a of prefsQuery.data) {
      init[a.id] = a.my_points ?? a.base_points;
    }
    setRatings(init);
  }, [prefsQuery.data]);

  if (isPending || (Boolean(user) && me.isLoading && !me.data)) {
    return <FullPageLoading message="Opening soft setup…" />;
  }
  if (!user) return <RedirectToSignIn />;
  if (me.data?.couple?.user_b && me.data.profile.onboarding_step === "done") {
    return <Navigate to="/app" />;
  }

  const stepOrder: StepId[] = ["profile", "pairing", "preferences"];
  const stepIndex = stepOrder.indexOf(step);

  function goBack() {
    if (step === "preferences") {
      setStep("pairing");
      return;
    }
    if (step === "pairing") {
      setStep("profile");
      return;
    }
  }

  function goToStep(target: StepId) {
    const targetIdx = stepOrder.indexOf(target);
    // Only allow going back (or staying), not skipping ahead past current progress
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

  async function saveProfile() {
    setBusy(true);
    try {
      await updateProfile({
        data: {
          display_name: name.trim() || "Little one",
          bio: bio.trim(),
          partner_nickname: nickname.trim(),
          onboarding_step: "pairing",
        },
      });
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
      await joinWithCode({ data: joinCode.trim().toUpperCase() });
      toast.success("Linked — welcome to your shared Brownie Points nest");
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
        preferred_points,
      }));
      if (payload.length) await savePreferences({ data: payload });
      await updateProfile({ data: { onboarding_step: "done" } });
      toast.success("Preferences saved — soft mode engaged");
      const fresh = await getMe();
      await me.refetch();
      if (fresh.couple?.user_b) {
        void nav({ to: "/app" });
      } else {
        setStep("pairing");
        toast.message("Waiting for your person to join with the code");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save prefs");
    } finally {
      setBusy(false);
    }
  }

  const accountLabel = user.primaryEmail || user.displayName || "this account";


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
        Step {stepIndex + 1} of {steps.length}
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
              Continue
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

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to profile
            </Button>
            {me.data?.couple ? (
              <Button variant="ghost" className="w-full" onClick={() => setStep("preferences")}>
                Rate preferences next
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {step === "preferences" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              What feels good to you?
            </CardTitle>
            <CardDescription>
              Your ratings shape the suggested scores when your partner logs things toward you.
              Changes only affect future logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!me.data?.couple ? (
              <p className="text-sm text-muted-foreground">
                Create or join a pair first so we can seed your shared action list.
              </p>
            ) : prefsQuery.isLoading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            ) : (
              (prefsQuery.data ?? []).map((a) => (
                <div key={a.id} className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium leading-snug">{a.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {a.kind} · default {a.base_points > 0 ? `+${a.base_points}` : a.base_points}
                      </p>
                    </div>
                    <Input
                      type="number"
                      className="w-20 text-center"
                      value={ratings[a.id] ?? a.base_points}
                      onChange={(e) =>
                        setRatings((r) => ({ ...r, [a.id]: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
              ))
            )}
            <Button
              className="w-full"
              disabled={busy || !me.data?.couple}
              onClick={() => void savePrefs()}
            >
              Save taste & continue
            </Button>
            <Button variant="outline" className="w-full" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to pairing
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
