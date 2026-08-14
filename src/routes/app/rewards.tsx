import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Gift, Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AppShell } from "@/components/paws/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useDashboard, useInvalidatePaws, useRewards } from "@/lib/paws/hooks";
import {
  buyWishlistItem,
  claimReward,
  resolveClaim,
  upsertReward,
} from "@/lib/paws/server";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Reward } from "@/lib/paws/types";
import { cn } from "@/lib/utils";
import { tone } from "@/lib/paws/tone";

export const Route = createFileRoute("/app/rewards")({
  component: RewardsPage,
});

type Tab = "treats" | "wishlist";

function RewardsPage() {
  const user = useCurrentUser();
  const rewards = useRewards(Boolean(user));
  const dash = useDashboard(Boolean(user));
  const invalidate = useInvalidatePaws();
  const [tab, setTab] = useState<Tab>("treats");
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [points, setPoints] = useState("");
  const [repeatable, setRepeatable] = useState(true);
  const [editing, setEditing] = useState<Reward | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const kind: "gesture" | "wishlist" = tab === "treats" ? "gesture" : "wishlist";

  const items = useMemo(
    () => (rewards.data ?? []).filter((r) => r.kind === kind),
    [rewards.data, kind],
  );
  const mine = useMemo(
    () => items.filter((r) => r.created_by === user?.id),
    [items, user?.id],
  );
  const theirs = useMemo(
    () => items.filter((r) => r.created_by !== user?.id),
    [items, user?.id],
  );

  const pendingClaims = dash.data?.pendingClaims ?? [];
  const theme = dash.data?.profile.theme;
  const t = (s: string) => tone(s, theme);

  function resetForm() {
    setName("");
    setDesc("");
    setPoints("");
    setRepeatable(true);
    setEditing(null);
    setShowNew(false);
  }

  function startEdit(r: Reward) {
    setEditing(r);
    setName(r.name);
    setDesc(r.description);
    setPoints(r.point_cost != null ? String(r.point_cost) : "");
    setRepeatable(r.repeatable);
    setShowNew(true);
    setTab(r.kind === "wishlist" ? "wishlist" : "treats");
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function saveItem() {
    if (!name.trim()) return;
    try {
      const pointNum = points.trim() === "" ? null : Number(points);
      await upsertReward({
        data: {
          id: editing?.id,
          name: name.trim(),
          description: desc.trim(),
          kind,
          repeatable,
          point_cost: kind === "wishlist" ? pointNum : undefined,
        },
      });
      toast.success(t(editing ? "Updated softly" : tab === "treats" ? "Treat added" : "Wish added"));
      resetForm();
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function removeItem(r: Reward) {
    try {
      await upsertReward({
        data: { id: r.id, name: r.name, archive: true },
      });
      toast.success(t("Removed from your list"));
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    }
  }

  return (
    <AppShell
      title={t("Treats & wishlist")}
      subtitle={t("Gestures you claim · wishes they buy for you")}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("Brownie Points balance")}
              </p>
              <p className="text-2xl font-semibold tabular text-primary">
                {dash.data?.balance.current ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("Accepted positive + negative − spent on treats")}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (showNew) resetForm();
                else {
                  setEditing(null);
                  setShowNew(true);
                  requestAnimationFrame(() => {
                    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                }
              }}
            >
              <Plus className="h-4 w-4" />
              {showNew ? "Close" : "Add"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={tab === "treats" ? "default" : "outline"}
            className="w-full"
            onClick={() => {
              setTab("treats");
              resetForm();
            }}
          >
            <Gift className="h-4 w-4" />
            Treats
          </Button>
          <Button
            variant={tab === "wishlist" ? "default" : "outline"}
            className="w-full"
            onClick={() => {
              setTab("wishlist");
              resetForm();
            }}
          >
            <ShoppingBag className="h-4 w-4" />
            Wishlist
          </Button>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {tab === "treats" ? (
            <>
              <strong className="text-foreground">Treats</strong> are non-money gestures you want
              (back rub, movie night). You list them;{" "}
              <em>your person sets the Brownie Points cost</em>. You claim with your Brownie Points — they approve.
            </>
          ) : (
            <>
              <strong className="text-foreground">Wishlist</strong> items (e.g. a vase) have buy Brownie Points
              you set. When your person buys it and you confirm,{" "}
              <em>they earn those Brownie Points</em>.
            </>
          )}
        </p>

        {showNew ? (
          <div ref={formRef}>
            <Card className="border-primary/35 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">
                  {editing ? "Edit" : "New"} {tab === "treats" ? "treat" : "wishlist item"}
                </CardTitle>
                <CardDescription>
                  {tab === "treats"
                    ? "Something soft you’d love to receive. Partner prices it later."
                    : "Something they can buy for you — set how many Brownie Points they earn."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      tab === "treats" ? "e.g. Breakfast in bed" : "e.g. Rosenthal vase"
                    }
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Optional soft details…"
                  />
                </div>
                {tab === "wishlist" ? (
                  <div className="space-y-2">
                    <Label>Buy Brownie Points (they earn when they buy it)</Label>
                    <Input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      placeholder="e.g. 10"
                    />
                  </div>
                ) : null}
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={repeatable}
                    onChange={(e) => setRepeatable(e.target.checked)}
                    className="size-4 rounded border-border"
                  />
                  Repeatable (can happen more than once)
                </label>
                <Button className="w-full" onClick={() => void saveItem()}>
                  {editing ? "Save changes" : "Add to my list"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {pendingClaims.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Needs a soft yes / no")}</CardTitle>
              <CardDescription>Approve treats or confirm wishlist purchases.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingClaims.map((cl) => (
                <div
                  key={cl.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3"
                >
                  <div>
                    <p className="text-sm font-medium leading-snug">
                      {cl.points_spent > 0
                        ? `${cl.claimer_name ?? "Partner"} wants to spend ${cl.points_spent} Brownie Points for “${cl.reward_name}”`
                        : `${cl.claimer_name ?? "Partner"} bought “${cl.reward_name}” for you`}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cl.points_spent > 0
                        ? "Approve to let them claim the treat"
                        : "Confirm so they earn the buy Brownie Points"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await resolveClaim({ data: { id: cl.id, decision: "approve" } });
                          toast.success(t("Approved"));
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await resolveClaim({ data: { id: cl.id, decision: "cancel" } });
                          toast.message(t("Cancelled — Brownie Points refunded if needed"));
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
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

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">
            {t(tab === "treats" ? "Your treats" : "Your wishlist")}
          </h2>
          {mine.map((r) => (
            <RewardCard
              key={r.id}
              r={r}
              mode="mine"
              tab={tab}
              t={t}
              onEdit={() => startEdit(r)}
              onRemove={() => void removeItem(r)}
              onClaim={async () => {
                try {
                  await claimReward({ data: { reward_id: r.id } });
                  toast.success(t("Claimed — waiting for partner approval"));
                  invalidate();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Claim failed");
                }
              }}
              onSaveWishlistPoints={async (v) => {
                try {
                  await upsertReward({
                    data: { id: r.id, name: r.name, point_cost: v },
                  });
                  toast.success(t("Buy Brownie Points updated"));
                  invalidate();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              }}
            />
          ))}
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tab === "treats"
                ? "Starter treats appear after pairing — edit or remove any of them. Or add your own."
                : "Add something lovely you’d love them to buy for you."}
            </p>
          ) : null}
        </section>

        <section className="space-y-2 pb-6">
          <h2 className="text-sm font-semibold">
            {t(tab === "treats" ? "Their treats" : "Their wishlist")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {tab === "treats"
              ? "You set the Brownie Points cost (you’re the one giving the treat)."
              : "Mark when you’ve bought an item — they confirm, then you earn the Brownie Points."}
          </p>
          {theirs.map((r) => (
            <RewardCard
              key={r.id}
              r={r}
              mode="theirs"
              tab={tab}
              t={t}
              onSetTreatCost={async (v) => {
                try {
                  await upsertReward({
                    data: { id: r.id, name: r.name, point_cost: v },
                  });
                  toast.success(t("Brownie Points cost set"));
                  invalidate();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              }}
              onBuy={async () => {
                try {
                  await buyWishlistItem({ data: { reward_id: r.id } });
                  toast.success(t("Sent for their confirmation — Brownie Points after they say yes"));
                  invalidate();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              }}
            />
          ))}
          {theirs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing on their list yet.</p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}

function RewardCard({
  r,
  mode,
  tab,
  t = (s) => s,
  onEdit,
  onRemove,
  onClaim,
  onSetTreatCost,
  onBuy,
  onSaveWishlistPoints,
}: {
  r: Reward;
  mode: "mine" | "theirs";
  tab: Tab;
  t?: (s: string) => string;
  onEdit?: () => void;
  onRemove?: () => void;
  onClaim?: () => void;
  onSetTreatCost?: (v: number) => void;
  onBuy?: () => void;
  onSaveWishlistPoints?: (v: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium leading-snug">{r.name}</p>
          {r.description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{r.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{tab === "treats" ? "Treat" : "Wishlist"}</Badge>
            <Badge variant="soft">
              {r.point_cost == null
                ? tab === "treats"
                  ? "Awaiting BP cost"
                  : "Set buy Brownie Points"
                : tab === "treats"
                  ? `${r.point_cost} BP to claim`
                  : `${r.point_cost} BP earned on buy`}
            </Badge>
            {!r.repeatable ? <Badge variant="outline">One-time</Badge> : null}
            {mode === "theirs" && r.created_by_name ? (
              <span className="text-xs text-muted-foreground">From {r.created_by_name}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cn("mt-3 flex flex-wrap items-center gap-2")}>
        {mode === "mine" ? (
          <>
            {tab === "treats" ? (
              <Button size="sm" disabled={r.point_cost == null} onClick={onClaim}>
                {t("Claim treat")}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24"
                  defaultValue={r.point_cost ?? undefined}
                  placeholder="Pts"
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isFinite(v)) return;
                    onSaveWishlistPoints?.(v);
                  }}
                />
                <span className="text-xs text-muted-foreground">buy BP</span>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </>
        ) : tab === "treats" ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="w-24"
              defaultValue={r.point_cost ?? undefined}
              placeholder="Cost"
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                onSetTreatCost?.(v);
              }}
            />
            <span className="text-xs text-muted-foreground">BP they spend</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">
              {r.point_cost == null
                ? "No buy Brownie Points set yet"
                : `They earn ${r.point_cost} Brownie Points if you buy this`}
            </Badge>
            <Button size="sm" variant="secondary" disabled={r.point_cost == null} onClick={onBuy}>
              {t("I bought this")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
