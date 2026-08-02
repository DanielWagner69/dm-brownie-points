import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Award,
  Bell,
  Flame,
  HeartHandshake,
  PawPrint,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/paws/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard, useInvalidatePaws } from "@/lib/paws/hooks";
import { markNotificationsRead, resolveClaim, reviewAction } from "@/lib/paws/server";
import { formatPoints } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

function HomePage() {
  const user = useCurrentUser();
  const dash = useDashboard(Boolean(user));
  const invalidate = useInvalidatePaws();
  const d = dash.data;

  useEffect(() => {
    if (d?.notifications.some((n) => !n.read)) {
      void markNotificationsRead().then(() => invalidate());
    }
  }, [d?.notifications, invalidate]);

  if (!d) return null;

  const partnerLabel =
    d.couple?.partner_name || d.profile.partner_nickname || "your person";

  return (
    <AppShell
      title={`Hey ${d.profile.display_name}`}
      subtitle={`Soft notes with ${partnerLabel}`}
    >
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="relative p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Brownie Points balance
                </p>
                <p
                  className={`mt-1 text-4xl font-semibold tracking-tight tabular ${
                    d.balance.current >= 0 ? "text-positive" : "text-danger"
                  }`}
                >
                  {formatPoints(d.balance.current)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Positive {formatPoints(d.balance.lifetime_positive)} · Negative{" "}
                  {d.balance.lifetime_negative} · Spent {d.balance.points_spent} BP
                </p>
              </div>
              <div className="rounded-2xl bg-primary/10 px-3 py-2 text-center">
                <Flame className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1 text-lg font-semibold tabular">{d.streak}</p>
                <p className="text-[10px] text-muted-foreground">day streak</p>
              </div>
            </div>
            {d.partnerBalance ? (
              <p className="mt-4 rounded-2xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                {partnerLabel} sits at{" "}
                <span className="font-medium text-foreground tabular">
                  {formatPoints(d.partnerBalance.current)}
                </span>{" "}
                Brownie Points — not a scoreboard, just a soft mirror.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              This week’s little letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{d.weeklySummary}</p>
          </CardContent>
        </Card>

        {d.pendingReviews.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Waiting for your soft review</CardTitle>
              <CardDescription>48h to accept, tweak, or gently decline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.pendingReviews.map((a) => (
                <div key={a.id} className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{a.action_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.direction === "self" ? "They did" : "You did"} ·{" "}
                        <span className="tabular">{formatPoints(a.points)}</span>
                      </p>
                      {a.note ? (
                        <p className="mt-1 text-sm text-muted-foreground">{a.note}</p>
                      ) : null}
                    </div>
                    <Badge variant={a.kind === "positive" ? "positive" : "negative"}>
                      {a.kind}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await reviewAction({ data: { id: a.id, decision: "accept" } });
                          toast.success("Accepted with love");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const pts = window.prompt("New Brownie Points?", String(a.points));
                        if (pts == null) return;
                        try {
                          await reviewAction({
                            data: {
                              id: a.id,
                              decision: "modify",
                              points: Number(pts),
                            },
                          });
                          toast.success("Tweaked gently");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Modify
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
                          toast.message("Declined and archived");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {d.pendingClaims.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reward claims to approve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.pendingClaims.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{c.reward_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.claimer_name} · {c.points_spent} Brownie Points
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
                      Approve
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
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {d.badges.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-primary" />
                Soft badges
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {d.badges.map((b) => (
                <Badge key={b.badge_key} variant="soft" className="px-3 py-1.5">
                  {b.title}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent Brownie Points</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/history">Full story</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing logged yet. Go log a little Brownie Point.
              </p>
            ) : (
              d.recent.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-muted/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.action_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.logger_name} · {a.status}
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
              ))
            )}
          </CardContent>
        </Card>

        {d.notifications.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-primary" />
                Soft pings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {d.notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="rounded-2xl border border-border/70 px-3 py-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-2 gap-3 pb-2">
          <Button asChild className="h-14">
            <Link to="/app/log">
              <PawPrint className="h-4 w-4" />
              Log Brownie Points
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-14">
            <Link to="/app/rewards">
              <HeartHandshake className="h-4 w-4" />
              Treats
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
