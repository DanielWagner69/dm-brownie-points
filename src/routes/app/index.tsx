import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  Flame,
  Gift,
  HeartHandshake,
  PawPrint,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/paws/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard, useInvalidatePaws } from "@/lib/paws/hooks";
import {
  resolveClaim,
  resolveModification,
  respondToDeletion,
  reviewAction,
} from "@/lib/paws/server";
import { formatPoints } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { tone, toneActionName } from "@/lib/paws/tone";
import { BADGE_CATALOG } from "@/lib/paws/defaults";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

function HomePage() {
  const user = useCurrentUser();
  const dash = useDashboard(Boolean(user));
  const invalidate = useInvalidatePaws();
  const d = dash.data;

  if (!d) return null;

  const theme = d.profile.theme;
  const t = (s: string) => tone(s, theme);
  const partnerLabel =
    d.couple?.partner_name || d.profile.partner_nickname || "your person";

  return (
    <AppShell
      title={`${t("Hey")} ${d.profile.display_name}`}
      subtitle={`${t("Soft notes with")} ${partnerLabel}`}
    >
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="relative p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {t("Brownie Points balance")}
                </p>
                <p
                  className={`mt-1 text-4xl font-semibold tracking-tight tabular ${
                    d.balance.current >= 0 ? "text-positive" : "text-danger"
                  }`}
                >
                  {formatPoints(d.balance.current)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("Positive")} {formatPoints(d.balance.lifetime_positive)} · {t("Negative")}{" "}
                  {d.balance.lifetime_negative} · Spent {d.balance.points_spent} BP
                </p>
              </div>
              <div className="rounded-2xl bg-primary/15 px-3 py-2 text-center ring-1 ring-primary/25">
                <Flame className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1 text-lg font-semibold tabular">{d.streak}</p>
                <p className="text-[10px] text-muted-foreground">{t("day streak")}</p>
              </div>
            </div>
            {d.partnerBalance ? (
              <p className="mt-4 rounded-2xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                {partnerLabel} sits at{" "}
                <span className="font-medium text-foreground tabular">
                  {formatPoints(d.partnerBalance.current)}
                </span>{" "}
                {t("Brownie Points — not a scoreboard, just a soft mirror.")}
              </p>
            ) : null}

            {d.treatTips && d.treatTips.length > 0 ? (
              <div className="mt-4 space-y-2 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Gift className="h-3.5 w-3.5" />
                  What you could claim
                </p>
                <ul className="space-y-1.5">
                  {d.treatTips.map((tip) => (
                    <li key={tip.summary} className="text-sm leading-snug text-muted-foreground">
                      {tip.summary}
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" variant="secondary" className="mt-1">
                  <Link to="/app/rewards">{t("Treats")}</Link>
                </Button>
              </div>
            ) : d.balance.current > 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Add treats on your list and have {partnerLabel} set the costs to see spend tips here.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">This week at a glance</CardTitle>
            <CardDescription>Soft stats for your shared Brownie Points nest.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-muted/50 px-3 py-2 text-center">
                <p className="text-lg font-semibold tabular text-positive">
                  {d.stats?.week_positive ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Positives</p>
              </div>
              <div className="rounded-2xl bg-muted/50 px-3 py-2 text-center">
                <p className="text-lg font-semibold tabular text-danger">
                  {d.stats?.week_negative ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Negatives</p>
              </div>
              <div className="rounded-2xl bg-muted/50 px-3 py-2 text-center">
                <p className="text-lg font-semibold tabular">
                  {d.stats?.week_accepted ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Accepted</p>
              </div>
              <div className="rounded-2xl bg-muted/50 px-3 py-2 text-center">
                <p className="text-lg font-semibold tabular">
                  {d.stats?.week_pending ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Still pending</p>
              </div>
              <div className="rounded-2xl bg-muted/50 px-3 py-2 text-center">
                <p className="text-lg font-semibold tabular">
                  {d.stats?.month_logged ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">This month</p>
              </div>
              <div className="rounded-2xl bg-muted/50 px-3 py-2 text-center">
                <p className="text-lg font-semibold tabular">
                  {(d.stats?.pending_claims ?? 0) + (d.stats?.pending_modifications ?? 0)}
                </p>
                <p className="text-[11px] text-muted-foreground">Claims / tweaks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.pendingDeletions?.length ?? 0) > 0 ? (
          <Card className="border-danger/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trash2 className="h-4 w-4 text-danger" />
                Delete needs your yes
              </CardTitle>
              <CardDescription>
                {partnerLabel} asked to remove something. Agree and it’s gone — or keep it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.pendingDeletions.map((dr) => (
                <div
                  key={dr.id}
                  className="rounded-2xl border border-border bg-surface p-3"
                >
                  <p className="text-sm font-medium">
                    {dr.entry_type === "history_wipe"
                      ? "Wipe entire history"
                      : dr.action_name
                        ? `Delete “${dr.action_name}”`
                        : "Delete a logged entry"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    From {dr.requester_name ?? partnerLabel}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        try {
                          await respondToDeletion({
                            data: { request_id: dr.id, decision: "approve" },
                          });
                          toast.success("Deleted — both agreed");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Agree to delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await respondToDeletion({
                            data: { request_id: dr.id, decision: "reject" },
                          });
                          toast.message("Kept in your story");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Keep it
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {(d.pendingModifications?.length ?? 0) > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your partner tweaked a score</CardTitle>
              <CardDescription>
                Both of you must agree on Brownie Points before it sticks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.pendingModifications.map((a) => (
                <div key={a.id} className="rounded-2xl border border-border bg-surface p-3">
                  <p className="text-sm font-medium">{toneActionName(a.action_name, a.kind, theme, a.id)}</p>
                  <p className="text-xs text-muted-foreground">
                    You logged {formatPoints(a.points)} · they propose{" "}
                    <span className="font-semibold text-foreground tabular">
                      {formatPoints(a.proposed_points ?? a.points)}
                    </span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await resolveModification({
                            data: { id: a.id, decision: "accept" },
                          });
                          toast.success("You both agreed on the points");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Agree to tweak
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await resolveModification({
                            data: { id: a.id, decision: "reject" },
                          });
                          toast.message("Kept original — back for their review");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Keep original
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {d.pendingReviews.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Waiting for your soft review")}</CardTitle>
              <CardDescription>{t("48h to accept, tweak, or gently decline.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.pendingReviews.map((a) => (
                <ReviewActions
                  key={a.id}
                  a={a}
                  t={t}
                  theme={theme}
                  onDone={invalidate}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {d.pendingClaims.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Reward claims to approve")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.pendingClaims.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3"
                >
                  <div>
                    <p className="text-sm font-medium leading-snug">
                      {c.points_spent > 0
                        ? `${c.claimer_name ?? "Partner"} wants to spend ${c.points_spent} Brownie Points for “${c.reward_name}”`
                        : `${c.claimer_name ?? "Partner"} bought “${c.reward_name}” for you`}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.points_spent > 0
                        ? "Approve to let them claim the treat"
                        : "Confirm so they earn the buy Brownie Points"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await resolveClaim({ data: { id: c.id, decision: "approve" } });
                        toast.success("Reward approved");
                        invalidate();
                      }}
                    >
                      {t("Approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await resolveClaim({ data: { id: c.id, decision: "cancel" } });
                        toast.message("Cancelled & refunded");
                        invalidate();
                      }}
                    >
                      {t("Cancel")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <BadgesPanel earned={d.badges} t={t} />

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("Recent Brownie Points")}</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/history">{t("Full story")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("Nothing logged yet. Go log a little Brownie Point.")}
              </p>
            ) : (
              d.recent.slice(0, 6).map((a) => {
                const tag = a.applies_to === user?.id ? "me" : "them";
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 ${
                      tag === "me" ? "action-tag-me" : "action-tag-them"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium leading-snug">
                        {toneActionName(a.action_name, a.kind, theme, a.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.logger_name} · {a.status === "held" ? "sending soon" : a.status}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular ${
                        a.points >= 0 ? "text-positive" : "text-danger"
                      }`}
                    >
                      {formatPoints(a.points)}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
          <Button asChild className="h-14">
            <Link to="/app/log">
              <PawPrint className="h-4 w-4" />
              {t("Log Brownie Points")}
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-14">
            <Link to="/app/rewards">
              <HeartHandshake className="h-4 w-4" />
              {t("Treats & wishes")}
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function BadgesPanel({
  earned,
  t,
}: {
  earned: { badge_key: string; title: string; description: string; earned_at: string }[];
  t: (s: string) => string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const earnedKeys = useMemo(() => new Set(earned.map((b) => b.badge_key)), [earned]);
  const selectedDef = selected
    ? BADGE_CATALOG.find((b) => b.key === selected)?.def
    : null;
  const selectedEarned = selected ? earned.find((b) => b.badge_key === selected) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-primary" />
          {t("Soft badges")}
        </CardTitle>
        <CardDescription>
          Tap a badge for the story behind it. Love-language badges track accepted positives raised for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {earned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No badges yet — keep logging kindness and they’ll start stacking.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {earned.map((b) => (
              <button
                key={b.badge_key}
                type="button"
                onClick={() => setSelected(b.badge_key === selected ? null : b.badge_key)}
                className="rounded-full"
              >
                <Badge
                  variant="soft"
                  className={`px-3 py-1.5 ${selected === b.badge_key ? "ring-2 ring-primary" : ""}`}
                >
                  {b.title}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {selected && selectedDef ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-3">
            <p className="text-sm font-semibold">{selectedDef.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{selectedDef.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">How to earn:</span> {selectedDef.how}
            </p>
            {selectedEarned ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Earned {new Date(selectedEarned.earned_at).toLocaleDateString()}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">Not earned yet</p>
            )}
          </div>
        ) : null}

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Hide full badge list" : `All badges (${BADGE_CATALOG.length})`}
        </Button>

        {showAll ? (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {BADGE_CATALOG.map(({ key, def }) => {
              const got = earnedKeys.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key === selected ? null : key)}
                  className={`w-full rounded-2xl border px-3 py-2 text-left transition-colors ${
                    got
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-surface opacity-80"
                  } ${selected === key ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{def.title}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {got ? "earned" : "locked"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{def.how}</p>
                </button>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReviewActions({
  a,
  t,
  theme,
  onDone,
}: {
  a: import("@/lib/paws/types").LoggedAction;
  t: (s: string) => string;
  theme: import("@/lib/paws/types").ThemeId | undefined;
  onDone: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="text-sm font-medium">{toneActionName(a.action_name, a.kind, theme, a.id)}</p>
      <p className="text-xs text-muted-foreground">
        {formatPoints(a.points)}
        {a.note ? ` · ${a.note}` : ""}
      </p>
      {a.photo_data ? (
        <img src={a.photo_data} alt="" className="mt-2 max-h-32 rounded-xl object-cover" />
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={async () => {
            try {
              await reviewAction({ data: { id: a.id, decision: "accept" } });
              toast.success("Accepted");
              onDone();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          {t("Accept")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            const pts = window.prompt("Propose new Brownie Points?", String(a.points));
            if (pts == null) return;
            try {
              await reviewAction({
                data: { id: a.id, decision: "modify", points: Number(pts) },
              });
              toast.success("Sent for their agreement");
              onDone();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          {t("Modify")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const note = window.prompt("A gentle note for declining?");
            if (!note?.trim()) return;
            try {
              await reviewAction({
                data: { id: a.id, decision: "decline", decline_note: note },
              });
              toast.message("Declined");
              onDone();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          {t("Decline")}
        </Button>
      </div>
    </div>
  );
}
