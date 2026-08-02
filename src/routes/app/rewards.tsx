import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Gift, Plus, ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/paws/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useDashboard, useInvalidatePaws, useRewards } from "@/lib/paws/hooks";
import {
  buyWishlistItem,
  claimReward,
  upsertReward,
} from "@/lib/paws/server";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/app/rewards")({
  component: RewardsPage,
});

function RewardsPage() {
  const user = useCurrentUser();
  const rewards = useRewards(Boolean(user));
  const dash = useDashboard(Boolean(user));
  const invalidate = useInvalidatePaws();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [kind, setKind] = useState<"gesture" | "wishlist">("gesture");

  const mine = useMemo(
    () => (rewards.data ?? []).filter((r) => r.created_by === user?.id),
    [rewards.data, user?.id],
  );
  const theirs = useMemo(
    () => (rewards.data ?? []).filter((r) => r.created_by !== user?.id),
    [rewards.data, user?.id],
  );

  async function create() {
    if (!name.trim()) return;
    try {
      await upsertReward({
        data: { name: name.trim(), description: desc.trim(), kind },
      });
      toast.success("Added to your soft list");
      setName("");
      setDesc("");
      setShowNew(false);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <AppShell title="Treats & wishes" subtitle="Non-financial love currencies">
      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Spendable paws
              </p>
              <p className="text-2xl font-semibold tabular text-primary">
                {dash.data?.balance.current ?? 0}
              </p>
            </div>
            <Button size="sm" onClick={() => setShowNew((v) => !v)}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </CardContent>
        </Card>

        {showNew ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New reward or wishlist item</CardTitle>
              <CardDescription>
                You create what you’d like to receive. Partner sets the paw-cost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={kind === "gesture" ? "default" : "outline"}
                  onClick={() => setKind("gesture")}
                >
                  Gesture
                </Button>
                <Button
                  size="sm"
                  variant={kind === "wishlist" ? "default" : "outline"}
                  onClick={() => setKind("wishlist")}
                >
                  Wishlist buy-points
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => void create()}>
                Save
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Gift className="h-4 w-4 text-primary" />
            Your wishlist (claim these)
          </h2>
          {mine.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{r.kind}</Badge>
                    <Badge variant="soft">
                      {r.point_cost == null ? "Awaiting partner cost" : `${r.point_cost} paws`}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={r.point_cost == null}
                  onClick={async () => {
                    try {
                      await claimReward({ data: { reward_id: r.id } });
                      toast.success("Claimed — waiting for partner approval");
                      invalidate();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Claim failed");
                    }
                  }}
                >
                  Claim
                </Button>
              </div>
            </div>
          ))}
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a soft treat you’d love.</p>
          ) : null}
        </section>

        <section className="space-y-2 pb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Their list (set costs / buy wishlist)
          </h2>
          {theirs.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-border bg-card p-4 shadow-sm"
            >
              <p className="font-medium">{r.name}</p>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                From {r.created_by_name} · {r.kind}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  className="w-24"
                  placeholder="Cost"
                  defaultValue={r.point_cost ?? undefined}
                  onBlur={async (e) => {
                    const v = Number(e.target.value);
                    if (!Number.isFinite(v)) return;
                    try {
                      await upsertReward({
                        data: { id: r.id, name: r.name, point_cost: v },
                      });
                      toast.success("Paw-cost set");
                      invalidate();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed");
                    }
                  }}
                />
                {r.kind === "wishlist" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={r.point_cost == null}
                    onClick={async () => {
                      try {
                        await buyWishlistItem({ data: { reward_id: r.id } });
                        toast.success("Bought — you earned those paws");
                        invalidate();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      }
                    }}
                  >
                    Buy & earn points
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
