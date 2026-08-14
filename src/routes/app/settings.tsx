import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Cloud, Flame, Flower2, Grape, LogOut, Moon, Plane, Pencil, Sun, Trash2 } from "lucide-react";
import { AppShell } from "@/components/paws/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PointsInput } from "@/components/ui/points-input";

import { useActionTypes, useCategories, useDashboard, useInvalidatePaws } from "@/lib/paws/hooks";
import {
  getPushPublicKey,
  getPushStatus,
  removePushSubscription,
  requestDeleteAction,
  savePreferences,
  savePushSubscription,
  unpair,
  updateProfile,
  upsertActionType,
  upsertCategory,
} from "@/lib/paws/server";
import { downloadText } from "@/lib/utils";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { ThemeId } from "@/lib/paws/types";
import { tone, toneActionName } from "@/lib/paws/tone";
import { cn, formatPoints } from "@/lib/utils";
import {
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/paws/push-client";
import { useQuery } from "@tanstack/react-query";
import { NestEditSettings } from "@/components/paws/nest-edit-settings";

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
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [wipeTyped, setWipeTyped] = useState("");
  const [pushBusy, setPushBusy] = useState(false);

  const actionTypes = useActionTypes(Boolean(user));
  const categories = useCategories(Boolean(user));
  const pushStatus = useQuery({
    queryKey: ["push-status"],
    queryFn: () => getPushStatus(),
    enabled: Boolean(user),
  });
  const [ratings, setRatings] = useState<Record<number, number>>({});

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#profile") {
      requestAnimationFrame(() => {
        document.getElementById("profile")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  useEffect(() => {
    if (!d) return;
    setName(d.profile.display_name);
    setBio(d.profile.bio);
    setNick(d.profile.partner_nickname);
    setPrefs(d.profile.notification_prefs);
  }, [d]);

  useEffect(() => {
    if (!actionTypes.data) return;
    const init: Record<number, number> = {};
    for (const a of actionTypes.data) init[a.id] = a.my_points ?? a.base_points;
    setRatings(init);
  }, [actionTypes.data]);

  if (!d || !prefs) return null;

  const theme = d.profile.theme;
  const t = (s: string) => tone(s, theme);

  const themes: { id: ThemeId; label: string; swatch: string; icon: typeof Sun }[] = [
    { id: "warm", label: "Warm cream", swatch: "#b56b4a", icon: Sun },
    { id: "dusk", label: "Soft dusk", swatch: "#d4926e", icon: Moon },
    { id: "blossom", label: "Blossom", swatch: "#a65d72", icon: Flower2 },
    { id: "burgundy", label: "Burgundy", swatch: "#8b1e3f", icon: Grape },
    { id: "flight", label: "Flight teal", swatch: "#5ed4c8", icon: Plane },
    { id: "sky", label: "Sky blue", swatch: "#3b9dd9", icon: Cloud },
    { id: "naughty", label: "Naughty", swatch: "#e84a8a", icon: Flame },
  ];

  return (
    <AppShell title={t("Nest settings")} subtitle={t("Themes, taste, pairing")}>
      <div className="space-y-4 pb-6">
        <Card id="profile">
          <CardHeader>
            <CardTitle className="text-base">{t("Profile")}</CardTitle>
            <CardDescription>{t("Change your display name, nickname, and bio anytime.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>{t("Display name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("Partner nickname")}</Label>
              <Input value={nick} onChange={(e) => setNick(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("Bio")}</Label>
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
              {t("Save profile")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Theme")}</CardTitle>
            <CardDescription>{t("Warm cream by default. Naughty adds flirty puns across the app (still private to you two).")}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {themes.map((tm) => {
              const Icon = tm.icon;
              const active = d.profile.theme === tm.id;
              return (
                <button
                  key={tm.id}
                  type="button"
                  onClick={async () => {
                    await updateProfile({ data: { theme: tm.id } });
                    document.documentElement.setAttribute("data-theme", tm.id);
                    invalidate();
                  }}
                  className={cn(
                    "flex min-h-[80px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-xs font-medium leading-snug break-words",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground",
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full ring-2 ring-border"
                    style={{ background: tm.swatch }}
                    aria-hidden
                  />
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                  {t(tm.label)}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <NestEditSettings d={d} invalidate={invalidate} />

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

            <div className="mt-4 space-y-2 rounded-2xl border border-primary/25 bg-primary/5 p-3">
              <p className="text-sm font-medium">Phone alerts</p>
              <p className="text-xs leading-snug text-muted-foreground">
                Yes — we can ping your phone. On Android, tap enable. On iPhone, first add
                Pawmise to your Home Screen, then enable here. Uses the same toggles above.
              </p>
              {pushStatus.data?.enabled ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={pushBusy}
                  onClick={async () => {
                    setPushBusy(true);
                    try {
                      const endpoint = await unsubscribeFromPush();
                      await removePushSubscription({ data: { endpoint: endpoint ?? undefined } });
                      toast.message("Phone alerts off on this device");
                      invalidate();
                      await pushStatus.refetch();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not turn off");
                    } finally {
                      setPushBusy(false);
                    }
                  }}
                >
                  <BellOff className="h-4 w-4" />
                  {pushBusy ? "Turning off…" : "Turn off phone alerts"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={pushBusy}
                  onClick={async () => {
                    setPushBusy(true);
                    try {
                      if (!pushSupported()) {
                        throw new Error(
                          "This browser can’t do phone alerts. On iPhone, add Pawmise to the Home Screen first.",
                        );
                      }
                      const { publicKey } = await getPushPublicKey();
                      if (!publicKey) throw new Error("Phone alerts aren’t ready yet — try again in a moment");
                      const sub = await subscribeToPush(publicKey);
                      const json = sub.toJSON();
                      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
                        throw new Error("Could not finish the phone subscription");
                      }
                      await savePushSubscription({
                        data: {
                          endpoint: json.endpoint,
                          p256dh: json.keys.p256dh,
                          auth: json.keys.auth,
                        },
                      });
                      toast.success("Phone alerts on for this device");
                      invalidate();
                      await pushStatus.refetch();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not enable");
                    } finally {
                      setPushBusy(false);
                    }
                  }}
                >
                  <Bell className="h-4 w-4" />
                  {pushBusy ? "Asking permission…" : "Enable phone alerts"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Action groups</CardTitle>
            <CardDescription>
              Categories used on Log and in your library. Rename, add, or remove — actions in a
              removed group move to “general”.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(categories.data ?? []).map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2"
              >
                {editingCat === c.id ? (
                  <>
                    <Input
                      className="min-w-0 flex-1"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      aria-label="Rename group"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await upsertCategory({
                            data: { id: c.id, name: editingCatName },
                          });
                          setEditingCat(null);
                          toast.success("Group renamed");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Could not rename");
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCat(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.action_count ?? 0} action{(c.action_count ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Rename ${c.name}`}
                      onClick={() => {
                        setEditingCat(c.id);
                        setEditingCatName(c.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {c.name.toLowerCase() !== "general" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-danger"
                        aria-label={`Remove ${c.name}`}
                        onClick={async () => {
                          const n = c.action_count ?? 0;
                          if (
                            !window.confirm(
                              n
                                ? `Remove “${c.name}”? ${n} action${n === 1 ? "" : "s"} will move to general.`
                                : `Remove “${c.name}”?`,
                            )
                          ) {
                            return;
                          }
                          try {
                            await upsertCategory({
                              data: { id: c.id, name: c.name, archive: true },
                            });
                            toast.success("Group removed");
                            invalidate();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Could not remove");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="New group name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <Button
                variant="secondary"
                disabled={!newCatName.trim()}
                onClick={async () => {
                  try {
                    await upsertCategory({ data: { name: newCatName.trim() } });
                    setNewCatName("");
                    toast.success("Group added");
                    invalidate();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not add");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("All actions & ratings")}</CardTitle>
            <CardDescription>
              Your ratings (primary) and partner ratings (smaller). Ratings cap at ±10 —
              Attention to Detail can add +2 on top when you log.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(actionTypes.data ?? []).map((a) => (
              <div key={a.id} className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium leading-snug">{toneActionName(a.name, a.kind, theme, a.id)}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {a.kind}
                    {!a.is_default ? " · custom" : ""}
                    <span className="ml-1.5 normal-case">
                      · you{" "}
                      <span className="font-medium text-foreground tabular">
                        {formatPoints(ratings[a.id] ?? a.my_points ?? a.base_points)}
                      </span>
                      {a.preferred_points != null ? (
                        <span className="text-muted-foreground/80">
                          {" "}· {d.couple?.partner_name || d.profile.partner_nickname || "partner"}{" "}
                          {formatPoints(a.preferred_points)}
                        </span>
                      ) : null}
                    </span>
                  </p>
                  <select
                    className="mt-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                    value={a.category || "general"}
                    onChange={async (e) => {
                      const next = e.target.value.trim() || "general";
                      try {
                        await upsertActionType({
                          data: {
                            id: a.id,
                            name: a.name,
                            kind: a.kind,
                            base_points: a.base_points,
                            category: next,
                          },
                        });
                        toast.success("Group updated");
                        invalidate();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not update group");
                      }
                    }}
                  >
                    {[
                      a.category || "general",
                      ...(categories.data ?? []).map((c) => c.name),
                    ]
                      .filter((v, i, arr) => arr.indexOf(v) === i)
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
                <PointsInput
                  className="w-20"
                  value={ratings[a.id] ?? a.my_points ?? a.base_points}
                  onValueChange={(n) => setRatings((r) => ({ ...r, [a.id]: n }))}
                  aria-label={`Brownie Points for ${a.name}`}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-danger"
                  aria-label={`Delete ${a.name}`}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Remove “${a.name}” from your nest? You can always add a custom action later.`,
                      )
                    ) {
                      return;
                    }
                    try {
                      await upsertActionType({
                        data: {
                          id: a.id,
                          name: a.name,
                          kind: a.kind,
                          base_points: a.base_points,
                          category: a.category,
                          archive: true,
                        },
                      });
                      toast.success("Removed from nest");
                      invalidate();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not delete");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
              {t("Save ratings")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Custom action")}</CardTitle>
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
              <PointsInput
                className="w-24"
                value={newPoints}
                onValueChange={setNewPoints}
                allowNegative={false}
                aria-label="Base Brownie Points"
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
                toast.success("Action added — it shows in Nest and Log");
                invalidate();
              }}
            >
              {t("Add action")}
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

        <details className="rounded-3xl border border-border/70 bg-surface/60 px-4 py-3">
          <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Danger zone — wipe history
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-sm leading-snug text-muted-foreground">
              This asks your partner to agree before anything is deleted. Type{" "}
              <span className="font-mono font-semibold text-foreground">WIPE</span> to unlock.
            </p>
            <Input
              value={wipeTyped}
              onChange={(e) => setWipeTyped(e.target.value)}
              placeholder="Type WIPE"
              autoComplete="off"
              aria-label="Type WIPE to confirm"
            />
            <Button
              variant="outline"
              className="w-full text-danger"
              disabled={wipeTyped.trim().toUpperCase() !== "WIPE"}
              onClick={async () => {
                if (wipeTyped.trim().toUpperCase() !== "WIPE") return;
                if (!window.confirm("Ask your partner to wipe the entire actions log?")) return;
                try {
                  const res = await requestDeleteAction({
                    data: { entry_type: "history_wipe" },
                  });
                  setWipeTyped("");
                  toast.message(
                    res.status === "approved"
                      ? "History wiped (both agreed)"
                      : "Wipe requested — partner will see it on Nest home to agree",
                  );
                  invalidate();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not request wipe");
                }
              }}
            >
              Request full history wipe
            </Button>
          </div>
        </details>
      </div>
    </AppShell>
  );
}
