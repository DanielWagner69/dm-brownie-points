import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Camera, Search } from "lucide-react";
import { AppShell } from "@/components/paws/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useActionTypes, useDashboard, useInvalidatePaws } from "@/lib/paws/hooks";
import { logAction } from "@/lib/paws/server";
import { cn, formatPoints } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { ActionType } from "@/lib/paws/types";

export const Route = createFileRoute("/app/log")({
  component: LogPage,
});

function LogPage() {
  const user = useCurrentUser();
  const dash = useDashboard(Boolean(user));
  const types = useActionTypes(Boolean(user));
  const invalidate = useInvalidatePaws();

  const [direction, setDirection] = useState<"self" | "partner">("self");
  const [kind, setKind] = useState<"all" | "positive" | "negative">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ActionType | null>(null);
  const [note, setNote] = useState("");
  const [detail, setDetail] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const partnerLabel =
    dash.data?.couple?.partner_name ||
    dash.data?.profile.partner_nickname ||
    "Partner";

  const filtered = useMemo(() => {
    let list = types.data ?? [];
    if (kind !== "all") list = list.filter((a) => a.kind === kind);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(s) || a.category.toLowerCase().includes(s),
      );
    }
    return list;
  }, [types.data, kind, search]);

  const suggested = selected
    ? (selected.preferred_points ?? selected.base_points) +
      (detail && selected.kind === "positive" ? 2 : 0)
    : 0;

  async function submit() {
    if (!selected) return;
    setBusy(true);
    try {
      await logAction({
        data: {
          action_type_id: selected.id,
          direction,
          note,
          photo_data: photo,
          attention_to_detail: detail,
        },
      });
      toast.success("Logged with soft paws");
      setSelected(null);
      setNote("");
      setDetail(false);
      setPhoto(null);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Log a paw" subtitle="Notice something small and kind">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who is this about?</CardTitle>
            <CardDescription>
              Be clear — this choice decides whose balance the points land on.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("self")}
              className={cn(
                "min-h-[72px] rounded-2xl border px-3 py-3 text-left transition-colors",
                direction === "self"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              <p className="text-sm font-semibold text-foreground">What I did</p>
              <p className="mt-1 text-xs leading-snug">
                Points apply to {direction === "self" ? "you" : "you"} after partner review
              </p>
            </button>
            <button
              type="button"
              onClick={() => setDirection("partner")}
              className={cn(
                "min-h-[72px] rounded-2xl border px-3 py-3 text-left transition-colors",
                direction === "partner"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              <p className="text-sm font-semibold text-foreground">What {partnerLabel} did</p>
              <p className="mt-1 text-xs leading-snug">
                Points apply to {partnerLabel}
              </p>
            </button>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {(["all", "positive", "negative"] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={kind === k ? "default" : "outline"}
              onClick={() => setKind(k)}
              className="capitalize"
            >
              {k}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((a) => {
            const pts = a.preferred_points ?? a.base_points;
            const active = selected?.id === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{a.name}</p>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {a.category}
                  </p>
                </div>
                <Badge variant={a.kind === "positive" ? "positive" : "negative"}>
                  {formatPoints(pts)}
                </Badge>
              </button>
            );
          })}
        </div>

        {selected ? (
          <Card className="sticky bottom-24 z-10 border-primary/30 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">{selected.name}</CardTitle>
              <CardDescription>
                Suggested {formatPoints(suggested)}
                {detail && selected.kind === "positive" ? " (includes Attention to Detail +2)" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selected.kind === "positive" ? (
                <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2">
                  <input
                    type="checkbox"
                    checked={detail}
                    onChange={(e) => setDetail(e.target.checked)}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  <span className="text-sm font-medium">Attention to Detail</span>
                </label>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="note">Little note</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional soft context…"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm">
                  <Camera className="h-4 w-4" />
                  Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 280_000) {
                        toast.error("Keep photos under ~280KB for now");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setPhoto(String(reader.result));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                ) : null}
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void submit()}>
                Log · {direction === "self" ? "What I did" : `What ${partnerLabel} did`}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
