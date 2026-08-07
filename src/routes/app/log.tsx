import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Camera, ImageIcon, Search } from "lucide-react";
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
import { compressImageFile } from "@/lib/paws/image";
import { tone, toneActionName } from "@/lib/paws/tone";

export const Route = createFileRoute("/app/log")({
  component: LogPage,
});

function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yearsAgoLocalISO(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Points value depends on who received the action (their preference). */
function pointsForDirection(a: ActionType, direction: "self" | "partner") {
  if (direction === "self") {
    // I did it → partner received it → partner's preference
    return a.preferred_points ?? a.base_points;
  }
  // They did it → I received it → my preference
  return a.my_points ?? a.base_points;
}

function LogPage() {
  const user = useCurrentUser();
  const dash = useDashboard(Boolean(user));
  const theme = dash.data?.profile.theme;
  const t = (s: string) => tone(s, theme);
  const types = useActionTypes(Boolean(user));
  const invalidate = useInvalidatePaws();

  const [direction, setDirection] = useState<"self" | "partner">("self");
  const [kind, setKind] = useState<"all" | "positive" | "negative">("all");
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ActionType | null>(null);
  const [note, setNote] = useState("");
  const [detail, setDetail] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [retrospective, setRetrospective] = useState(false);
  const [occurredOn, setOccurredOn] = useState(todayLocalISO());

  const partnerLabel =
    dash.data?.couple?.partner_name ||
    dash.data?.profile.partner_nickname ||
    "Partner";

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of types.data ?? []) {
      if (a.category?.trim()) set.add(a.category.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [types.data]);

  const filtered = useMemo(() => {
    let list = types.data ?? [];
    if (kind !== "all") list = list.filter((a) => a.kind === kind);
    if (category) list = list.filter((a) => a.category === category);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(s) || a.category.toLowerCase().includes(s),
      );
    }
    return list;
  }, [types.data, kind, category, search]);

  const basePts = selected ? pointsForDirection(selected, direction) : 0;
  const suggested =
    selected && detail && selected.kind === "positive" ? basePts + 2 : basePts;

  const beneficiaryLabel = direction === "self" ? "you" : partnerLabel;
  const beneficiaryName = direction === "self" ? "your" : `${partnerLabel}'s`;

  function confirmMessage(pts: number, actionName: string): string {
    const abs = Math.abs(pts);
    if (pts >= 0) {
      return (
        `Confirm log?\n\n` +
        `Action: ${actionName}\n` +
        `This will add ${formatPoints(pts)} Brownie Points to ${beneficiaryName} balance` +
        (direction === "self" ? " (yours)." : ` (${partnerLabel}).`) +
        `\n\nStill needs partner approval before it counts.`
      );
    }
    return (
      `Confirm log?\n\n` +
      `Action: ${actionName}\n` +
      `This will remove ${abs} Brownie Points from ${beneficiaryName} balance` +
      (direction === "self" ? " (yours)." : ` (${partnerLabel}).`) +
      `\n\nStill needs partner approval before it counts.`
    );
  }

  async function submit() {
    if (!selected) return;
    const ok = window.confirm(confirmMessage(suggested, selected.name));
    if (!ok) return;
    setBusy(true);
    try {
      await logAction({
        data: {
          action_type_id: selected.id,
          direction,
          note,
          photo_data: photo,
          attention_to_detail: detail,
          occurred_on:
            retrospective && occurredOn
              ? occurredOn
              : null,
        },
      });
      toast.success(
        retrospective
          ? `Logged for that day — ${formatPoints(suggested)} for ${beneficiaryLabel}, needs approval`
          : `Logged — ${formatPoints(suggested)} for ${beneficiaryLabel}, waiting for approval`,
      );
      setSelected(null);
      setNote("");
      setDetail(false);
      setPhoto(null);
      setRetrospective(false);
      setOccurredOn(todayLocalISO());
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title={t("Log Brownie Points")} subtitle={t("Turn a little moment into Brownie Points")}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Who is this about?")}</CardTitle>
            <CardDescription>
              Who performed the action decides whose balance changes. The other person's
              rating sets how many points.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("self")}
              className={cn(
                "min-h-[88px] rounded-2xl border px-3 py-3 text-left transition-colors",
                direction === "self"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              <p className="text-sm font-semibold">{t("What I did")}</p>
              <p className="mt-1 text-xs leading-snug">
                Points go to <span className="font-medium text-foreground">you</span>. Value from{" "}
                {partnerLabel}'s rating.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setDirection("partner")}
              className={cn(
                "min-h-[88px] rounded-2xl border px-3 py-3 text-left transition-colors",
                direction === "partner"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              <p className="text-sm font-semibold">What {partnerLabel} did</p>
              <p className="mt-1 text-xs leading-snug">
                Points go to <span className="font-medium text-foreground">{partnerLabel}</span>.
                Value from your rating.
              </p>
            </button>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("Search actions…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "positive", "negative"] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={kind === k ? "default" : "outline"}
              onClick={() => setKind(k)}
            >
              {k === "all" ? "All" : t(k === "positive" ? "Positive" : "Negative")}
            </Button>
          ))}
        </div>

        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={!category ? "secondary" : "outline"}
              onClick={() => setCategory("")}
            >
              All groups
            </Button>
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={category === c ? "secondary" : "outline"}
                onClick={() => setCategory(category === c ? "" : c)}
              >
                {c}
              </Button>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {direction === "self"
            ? `Showing ${partnerLabel}'s preferred points (they received it → you earn that value).`
            : `Showing your preferred points (you received it → ${partnerLabel} earns that value).`}
        </p>

        <div className="space-y-2">
          {filtered.map((a) => {
            const pts = pointsForDirection(a, direction);
            const active = selected?.id === a.id;
            const partnerPts = a.preferred_points ?? a.base_points;
            const myPts = a.my_points ?? a.base_points;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a)}
                className={cn(
                  "flex w-full min-w-0 items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    {toneActionName(a.name, a.kind, theme, a.id)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="capitalize">
                      {a.category || "general"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {partnerLabel}: {formatPoints(partnerPts)} · You: {formatPoints(myPts)}
                    </span>
                  </div>
                </div>
                <Badge variant={a.kind === "positive" ? "positive" : "negative"}>
                  {formatPoints(pts)}
                </Badge>
              </button>
            );
          })}
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No actions match.</p>
          ) : null}
        </div>

        {selected ? (
          <Card className="sticky bottom-24 z-10 border-primary/30 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">
                {toneActionName(selected.name, selected.kind, theme, selected.id)}
              </CardTitle>
              <CardDescription>
                <span className="font-medium text-foreground">
                  {formatPoints(suggested)} → {beneficiaryLabel}
                </span>
                {" · "}
                group: {selected.category || "general"}
                {detail && selected.kind === "positive" ? " · +2 Attention to Detail" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={cn(
                  "rounded-2xl border px-3 py-2.5 text-sm leading-snug",
                  suggested >= 0
                    ? "border-positive/30 bg-positive/10 text-foreground"
                    : "border-danger/30 bg-danger/10 text-foreground",
                )}
              >
                {suggested >= 0 ? (
                  <>
                    Logging this will{" "}
                    <strong>add {formatPoints(suggested)} Brownie Points</strong> to{" "}
                    <strong>{beneficiaryName} balance</strong>
                    {direction === "self" ? " (yours)" : ` (${partnerLabel})`}.
                  </>
                ) : (
                  <>
                    Logging this will{" "}
                    <strong>remove {Math.abs(suggested)} Brownie Points</strong> from{" "}
                    <strong>{beneficiaryName} balance</strong>
                    {direction === "self" ? " (yours)" : ` (${partnerLabel})`}.
                  </>
                )}
                <span className="mt-1 block text-xs text-muted-foreground">
                  Partner still has to approve before it counts.
                </span>
              </div>

              {selected.kind === "positive" ? (
                <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2">
                  <input
                    type="checkbox"
                    checked={detail}
                    onChange={(e) => setDetail(e.target.checked)}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  <span className="text-sm font-medium">{t("Attention to Detail")}</span>
                </label>
              ) : null}

              <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2">
                <input
                  type="checkbox"
                  checked={retrospective}
                  onChange={(e) => {
                    setRetrospective(e.target.checked);
                    if (e.target.checked && !occurredOn) setOccurredOn(todayLocalISO());
                  }}
                  className="h-5 w-5 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium">{t("Log for a past day")}</span>
              </label>
              {retrospective ? (
                <div className="space-y-2">
                  <Label>{t("When did this happen?")}</Label>
                  <Input
                    type="date"
                    value={occurredOn}
                    min={yearsAgoLocalISO(2)}
                    max={todayLocalISO()}
                    onChange={(e) => setOccurredOn(e.target.value)}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>{t("Optional note")}</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("A little detail…")}
                  rows={2}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm">
                  <Camera className="h-4 w-4" />
                  Camera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const data = await compressImageFile(f);
                        setPhoto(data);
                      } catch {
                        toast.error("Could not process photo");
                      }
                    }}
                  />
                </label>
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm">
                  <ImageIcon className="h-4 w-4" />
                  Gallery
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const data = await compressImageFile(f);
                        setPhoto(data);
                      } catch {
                        toast.error("Could not process photo");
                      }
                    }}
                  />
                </label>
                {photo ? (
                  <Button size="sm" variant="ghost" onClick={() => setPhoto(null)}>
                    Remove photo
                  </Button>
                ) : null}
              </div>

              <Button className="w-full" disabled={busy} onClick={() => void submit()}>
                {busy ? t("Logging…") : t("Log Brownie Points")}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
