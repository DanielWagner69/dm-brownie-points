import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flower2, Grape, LogOut, Moon, Plane, Sun } from "lucide-react";
import { AppShell } from "@/components/paws/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useDashboard, useInvalidatePaws } from "@/lib/paws/hooks";
import {
  listMyPreferenceTargets,
  savePreferences,
  unpair,
  updateProfile,
  upsertActionType,
} from "@/lib/paws/server";
import { useQuery } from "@tanstack/react-query";
import { downloadText } from "@/lib/utils";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { ThemeId } from "@/lib/paws/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const user = useCurrentUser();
  const dash = useDashboard(Boolean(user));
  const invalidate = useInvalidatePaws();
  const nav = useNavigate();
  const d = dash.data;

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [nick, setNick] = useState("");
  const [prefs, setPrefs] = useState(d?.profile.notification_prefs);
  const [newAction, setNewAction] = useState("");
  const [newPoints, setNewPoints] = useState(1);
  const [newKind, setNewKind] = useState<"positive" | "negative">("positive");

  const prefTargets = useQuery({
    queryKey: ["pref-targets-settings"],
    queryFn: () => listMyPreferenceTargets(),
    enabled: Boolean(user),
  });
  const [ratings, setRatings] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!d) return;
    setName(d.profile.display_name);
    setBio(d.profile.bio);
    setNick(d.profile.partner_nickname);
    setPrefs(d.profile.notification_prefs);
  }, [d]);

  useEffect(() => {
    if (!prefTargets.data) return;
    const init: Record<number, number> = {};
    for (const a of prefTargets.data) init[a.id] = a.my_points ?? a.base_points;
    setRatings(init);
  }, [prefTargets.data]);

  if (!d || !prefs) return null;

  const themes: { id: ThemeId; label: string; swatch: string; icon: typeof Sun }[] = [
    { id: "warm", label: "Warm cream", swatch: "#b56b4a", icon: Sun },
    { id: "dusk", label: "Soft dusk", swatch: "#d4926e", icon: Moon },
    { id: "blossom", label: "Blossom", swatch: "#a65d72", icon: Flower2 },
    { id: "burgundy", label: "Burgundy", swatch: "#8b1e3f", icon: Grape },
    { id: "flight", label: "Flight teal", swatch: "#5ed4c8", icon: Plane },
  ];

  return (
    <AppShell title="Nest settings" subtitle="Themes, taste, pairing">
      <div className="space-y-4 pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Partner nickname</Label>
              <Input value={nick} onChange={(e) => setNick(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <Button
              onClick={async () => {
                await updateProfile({
                  data: {
                    display_name: name,
                    bio,
                    partner_nickname: nick,
                  },
                });
                toast.success("Profile updated");
                invalidate();
              }}
            >
              Save profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theme</CardTitle>
            <CardDescription>Warm cream by default. Burgundy for deep wine vibes; Flight teal from that mint-on-deep-teal look.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const active = d.profile.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={async () => {
                    await updateProfile({ data: { theme: t.id } });
                    document.documentElement.setAttribute("data-theme", t.id);
                    invalidate();
                  }}
                  className={cn(
                    "flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-medium",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground",
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full ring-2 ring-border"
                    style={{ background: t.swatch }}
                    aria-hidden
                  />
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                  {t.label}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gentle pings</CardTitle>
            <CardDescription>
              Choose which soft events show up in-app. Language stays in-character.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(
              [
                ["actions", "New actions logged"],
                ["reviews", "Reviews & accepts"],
                ["rewards", "Reward claims"],
                ["summaries", "Weekly little letters"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-border px-3"
              >
                <span className="text-sm">{label}</span>
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                  className="h-5 w-5 accent-[var(--primary)]"
                />
              </label>
            ))}
            <Button
              variant="secondary"
              onClick={async () => {
                await updateProfile({ data: { notification_prefs: prefs } });
                toast.success("Ping prefs saved");
                invalidate();
              }}
            >
              Save ping prefs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your preference ratings</CardTitle>
            <CardDescription>
              Only affect future suggested scores when actions apply to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(prefTargets.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-sm">{a.name}</p>
                <Input
                  type="number"
                  className="w-20"
                  value={ratings[a.id] ?? a.base_points}
                  onChange={(e) =>
                    setRatings((r) => ({ ...r, [a.id]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}
            <Button
              onClick={async () => {
                await savePreferences({
                  data: Object.entries(ratings).map(([id, preferred_points]) => ({
                    action_type_id: Number(id),
                    preferred_points,
                  })),
                });
                toast.success("Taste updated");
              }}
            >
              Save ratings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom action</CardTitle>
            <CardDescription>Add something unique to your pair, then archive later if needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Action name"
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={newKind === "positive" ? "default" : "outline"}
                onClick={() => setNewKind("positive")}
              >
                Positive
              </Button>
              <Button
                size="sm"
                variant={newKind === "negative" ? "default" : "outline"}
                onClick={() => setNewKind("negative")}
              >
                Negative
              </Button>
              <Input
                type="number"
                className="w-24"
                value={newPoints}
                onChange={(e) => setNewPoints(Number(e.target.value))}
              />
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                if (!newAction.trim()) return;
                await upsertActionType({
                  data: {
                    name: newAction.trim(),
                    kind: newKind,
                    base_points:
                      newKind === "negative" ? -Math.abs(newPoints) : Math.abs(newPoints),
                  },
                });
                setNewAction("");
                toast.success("Action added");
                invalidate();
              }}
            >
              Add action
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pairing</CardTitle>
            <CardDescription>
              Code:{" "}
              <span className="font-mono font-semibold text-primary">
                {d.couple?.invite_code}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                const exportFirst = window.confirm(
                  "Export your history as CSV before unpairing?",
                );
                try {
                  const res = await unpair({ data: { exportFirst } });
                  if (res.exportCsv) {
                    downloadText(`pawmise-export-${Date.now()}.csv`, res.exportCsv);
                  }
                  toast.message("Unpaired — shared data cleared");
                  nav({ to: "/onboarding" });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Unpair failed");
                }
              }}
            >
              Unpair (export optional, then delete)
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => void signOut().then(() => nav({ to: "/login" }))}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
