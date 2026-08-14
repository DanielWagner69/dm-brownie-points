import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImageIcon, Plus, Search, Send, Undo2, X } from "lucide-react";
import { AppShell } from "@/components/paws/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PointsInput } from "@/components/ui/points-input";
import { useActionTypes, useCategories, useDashboard, useInvalidatePaws } from "@/lib/paws/hooks";
import {
  cancelHeldAction,
  editLoggedAction,
  logAction,
  releaseHeldAction,
  upsertActionType,
} from "@/lib/paws/server";
import { cn, clampBasePoints, formatPoints } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { ActionType } from "@/lib/paws/types";
import { compressImageFile } from "@/lib/paws/image";
import { tone, toneActionName } from "@/lib/paws/tone";
import { suggestActions } from "@/lib/paws/fuzzy";

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

function pointsForDirection(a: ActionType, direction: "self" | "partner") {
  if (direction === "self") {
    return a.preferred_points ?? a.base_points;
  }
  return a.my_points ?? a.base_points;
}

function relativeApplies(
  applies: string | undefined,
  userId: string | undefined,
  couple: { user_a: string; user_b: string | null } | null | undefined,
): "me" | "them" | "both" {
  if (!applies || applies === "both" || !userId || !couple) return "both";
  if (applies === "user_a") return couple.user_a === userId ? "me" : "them";
  if (applies === "user_b") return couple.user_b === userId ? "me" : "them";
  return "both";
}

function canShowForDirection(
  applies: string | undefined,
  direction: "self" | "partner",
  userId: string | undefined,
  couple: { user_a: string; user_b: string | null } | null | undefined,
): boolean {
  const rel = relativeApplies(applies, userId, couple);
  if (rel === "both") return true;
  return direction === "self" ? rel === "me" : rel === "them";
}

type HoldState = {
  id: string;
  name: string;
  heldUntil: number;
  note: string;
  points: number;
};

function LogPage() {
  const user = useCurrentUser();
  const dash = useDashboard(Boolean(user));
  const theme = dash.data?.profile.theme;
  const t = (s: string) => tone(s, theme);
  const types = useActionTypes(Boolean(user));
  const cats = useCategories(Boolean(user));
  const invalidate = useInvalidatePaws();

  const [direction, setDirection] = useState<"self" | "partner">("partner");
  const [kind, setKind] = useState<"all" | "positive" | "negative">("all");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ActionType | null>(null);
  const [note, setNote] = useState("");
  const [detail, setDetail] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [retrospective, setRetrospective] = useState(false);
  const [occurredOn, setOccurredOn] = useState(todayLocalISO());

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<"positive" | "negative">("positive");
  const [newPoints, setNewPoints] = useState(5);
  const [newCategory, setNewCategory] = useState("general");
  const [creating, setCreating] = useState(false);

  const [hold, setHold] = useState<HoldState | null>(null);
  const [holdLeft, setHoldLeft] = useState(0);
  const releasingRef = useRef(false);

  const partnerLabel =
    dash.data?.couple?.partner_name ||
    dash.data?.profile.partner_nickname ||
    "Partner";

  const categories = useMemo(() => {
    const fromTable = (cats.data ?? []).map((c) => c.name);
    if (fromTable.length) return fromTable;
    const set = new Set<string>();
    for (const a of types.data ?? []) {
      if (a.category?.trim()) set.add(a.category.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cats.data, types.data]);

  const couple = dash.data?.couple;
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
    list = list.filter((a) =>
      canShowForDirection(a.applies_to, direction, user?.id, couple),
    );
    return list;
  }, [types.data, kind, category, search, direction, user?.id, couple]);

  const fuzzySuggestions = useMemo(
    () => suggestActions(newName, types.data ?? [], 5),
    [newName, types.data],
  );

  const basePts = selected ? clampBasePoints(pointsForDirection(selected, direction)) : 0;
  const suggested =
    selected && detail && selected.kind === "positive" ? basePts + 2 : basePts;

  const beneficiaryLabel = direction === "self" ? "you" : partnerLabel;
  const beneficiaryName = direction === "self" ? "your" : `${partnerLabel}'s`;

  useEffect(() => {
    if (!hold) {
      setHoldLeft(0);
      releasingRef.current = false;
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((hold.heldUntil - Date.now()) / 1000));
      setHoldLeft(left);
      if (left <= 0 && !releasingRef.current) {
        releasingRef.current = true;
        void (async () => {
          try {
            await releaseHeldAction({ data: { id: hold.id } });
            toast.success("Sent to your partner");
            setHold(null);
            invalidate();
          } catch (e) {
            releasingRef.current = false;
            toast.error(e instanceof Error ? e.message : "Could not send");
          }
        })();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [hold, invalidate]);

  useEffect(() => {
    if (hold) return;
    const held = dash.data?.heldActions?.[0];
    if (!held?.held_until) return;
    const until = new Date(held.held_until).getTime();
    if (until > Date.now()) {
      setHold({
        id: held.id,
        name: held.action_name,
        heldUntil: until,
        note: held.note,
        points: held.points,
      });
    }
  }, [dash.data?.heldActions, hold]);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    try {
      setPhoto(await compressImageFile(file));
    } catch {
      toast.error("Could not read that photo");
    }
  }

  async function submit() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await logAction({
        data: {
          action_type_id: selected.id,
          direction,
          note,
          photo_data: photo,
          attention_to_detail: detail,
          points_override: clampBasePoints(basePts),
          occurred_on: retrospective && occurredOn ? occurredOn : null,
        },
      });
      if (res.status === "held" && res.held_until) {
        setHold({
          id: res.id,
          name: selected.name,
          heldUntil: new Date(res.held_until).getTime(),
          note,
          points: suggested,
        });
        toast.message(
          `Saved · ${formatPoints(suggested)} for ${beneficiaryLabel} — 30s to amend before partner sees it`,
        );
      } else {
        toast.success(
          `Logged — ${formatPoints(suggested)} for ${beneficiaryLabel}, waiting for approval`,
        );
      }
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

  async function createAndSelect(name: string, kind: "positive" | "negative", pts: number) {
    setCreating(true);
    try {
      const base = clampBasePoints(kind === "negative" ? -Math.abs(pts) : Math.abs(pts));
      let applies_to: "both" | "user_a" | "user_b" = "both";
      if (couple?.user_a && couple?.user_b && user?.id) {
        const meSide = couple.user_a === user.id ? "user_a" : "user_b";
        const themSide = couple.user_a === user.id ? "user_b" : "user_a";
        applies_to = direction === "self" ? meSide : themSide;
      }
      const { id } = await upsertActionType({
        data: {
          name: name.trim(),
          kind,
          base_points: base,
          category: newCategory,
          applies_to,
        },
      });
      invalidate();
      const refreshed = await types.refetch();
      const found = (refreshed.data ?? []).find((a) => a.id === id);
      if (found) setSelected(found);
      else {
        setSelected({
          id,
          couple_id: "",
          name: name.trim(),
          kind,
          base_points: base,
          category: newCategory || "general",
          is_default: false,
          archived: false,
          applies_to,
          preferred_points: base,
          my_points: base,
        });
      }
      setShowAdd(false);
      setNewName("");
      toast.success("Action ready to log");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create action");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell title={t("Log Brownie Points")} subtitle={t("Turn a little moment into Brownie Points")}>
      <div className="space-y-4">
        {hold ? (
          <Card className="border-primary/40 bg-primary/5 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Not sent yet · {holdLeft}s</CardTitle>
              <CardDescription>
                “{toneActionName(hold.name, "positive", theme, hold.id)}” is held so you can
                fix a mistake. Partner only sees it after the timer — or when you send now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${Math.max(0, (holdLeft / 30) * 100)}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (releasingRef.current) return;
                    releasingRef.current = true;
                    try {
                      await releaseHeldAction({ data: { id: hold.id } });
                      toast.success("Sent to your partner");
                      setHold(null);
                      invalidate();
                    } catch (e) {
                      releasingRef.current = false;
                      toast.error(e instanceof Error ? e.message : "Could not send");
                    }
                  }}
                >
                  <Send className="h-4 w-4" />
                  Send now
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const pts = window.prompt("Amend Brownie Points", String(hold.points));
                    if (pts == null) return;
                    const n = window.prompt("Amend note", hold.note);
                    if (n == null) return;
                    try {
                      await editLoggedAction({
                        data: { id: hold.id, points: Number(pts), note: n },
                      });
                      setHold((h) => (h ? { ...h, points: Number(pts), note: n } : h));
                      toast.success("Amended — still held");
                      invalidate();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not amend");
                    }
                  }}
                >
                  Amend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await cancelHeldAction({ data: { id: hold.id } });
                      toast.message("Discarded — partner never saw it");
                      setHold(null);
                      invalidate();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not undo");
                    }
                  }}
                >
                  <Undo2 className="h-4 w-4" />
                  Undo
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Who is this about?")}</CardTitle>
            <CardDescription>
              Only actions assigned to that person (or both of you) appear below. The other
              person’s rating sets how many Brownie Points.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("self")}
              className={cn(
                "min-h-[88px] rounded-2xl border-2 px-3 py-3 text-left transition-colors",
                direction === "self"
                  ? "border-primary bg-primary/15 text-foreground shadow-sm"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              <p className="text-sm font-semibold text-foreground">{t("What I did")}</p>
              <p className="mt-1 text-xs leading-snug">
                Points go to <span className="font-medium text-foreground">you</span>. Value from{" "}
                {partnerLabel}&apos;s rating.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setDirection("partner")}
              className={cn(
                "min-h-[88px] rounded-2xl border-2 px-3 py-3 text-left transition-colors",
                direction === "partner"
                  ? "border-primary bg-primary/15 text-foreground shadow-sm"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              <p className="text-sm font-semibold text-foreground">What {partnerLabel} did</p>
              <p className="mt-1 text-xs leading-snug">
                Points go to <span className="font-medium text-foreground">{partnerLabel}</span>.
                Value from your rating.
              </p>
            </button>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("Search actions…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowAdd(true);
              setNewName(search.trim());
            }}
          >
            <Plus className="h-4 w-4" />
            Add new
          </Button>
        </div>

        {showAdd ? (
          <Card className="border-primary/35 shadow-lg">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">New action</CardTitle>
                <CardDescription>
                  Type a name — we suggest similar ones from your library if they match.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Close"
                onClick={() => {
                  setShowAdd(false);
                  setNewName("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-action-name">Name</Label>
                <Input
                  id="new-action-name"
                  autoFocus
                  placeholder='e.g. "Masha cooked a meal"'
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              {fuzzySuggestions.length > 0 ? (
                <div className="space-y-2 rounded-2xl border border-primary/25 bg-primary/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Similar in your library
                  </p>
                  <div className="space-y-1.5">
                    {fuzzySuggestions.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setSelected(a);
                          setShowAdd(false);
                          setNewName("");
                          toast.message(`Using “${a.name}”`);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="min-w-0 text-sm font-medium leading-snug">
                          {toneActionName(a.name, a.kind, theme, a.id)}
                        </span>
                        <Badge variant={a.kind === "positive" ? "positive" : "negative"}>
                          {formatPoints(pointsForDirection(a, direction))}
                        </Badge>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tap one to use it, or keep typing to create something new.
                  </p>
                </div>
              ) : newName.trim().length >= 2 ? (
                <p className="text-xs text-muted-foreground">
                  No close matches — this will be a fresh action.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
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
              <div className="space-y-1.5">
                <Label htmlFor="new-action-cat">Group</Label>
                <select
                  id="new-action-cat"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {(categories.includes(newCategory) ? categories : [newCategory, ...categories])
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-muted-foreground">Ratings cap at 10. Detail bonus is extra.</p>
              </div>
              <Button
                className="w-full"
                disabled={creating || !newName.trim()}
                onClick={() => void createAndSelect(newName, newKind, newPoints)}
              >
                {creating ? "Creating…" : "Create & select"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

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
            ? `Showing actions that apply to you · points from ${partnerLabel}'s rating.`
            : `Showing actions that apply to ${partnerLabel} · points from your rating.`}
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
                  "flex w-full min-w-0 items-start justify-between gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/15 shadow-sm"
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/40",
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
                    <span className="text-xs font-medium tabular text-foreground">
                      You {formatPoints(myPts)}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular">
                      · {partnerLabel} {formatPoints(partnerPts)}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setSelected(null)}
              aria-hidden
            />
            <Card className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto border-primary/40 shadow-xl">
              <CardHeader className="relative pr-12">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-3 top-3"
                  aria-label="Close"
                  onClick={() => setSelected(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
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
                    You’ll have 30 seconds to amend before partner is notified.
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
                    <Label htmlFor="occurred">When did this happen?</Label>
                    <Input
                      id="occurred"
                      type="date"
                      value={occurredOn}
                      max={todayLocalISO()}
                      min={yearsAgoLocalISO(2)}
                      onChange={(e) => setOccurredOn(e.target.value)}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="note">{t("Little note")}</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("Optional soft context…")}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Photo</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border-2 border-border bg-surface px-3 text-sm font-medium hover:border-primary/40">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      {t("Gallery")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          void pickPhoto(file);
                        }}
                      />
                    </label>
                    <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border-2 border-border bg-surface px-3 text-sm font-medium hover:border-primary/40">
                      <Camera className="h-4 w-4 text-primary" />
                      {t("Camera")}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          void pickPhoto(file);
                        }}
                      />
                    </label>
                  </div>
                  {photo ? (
                    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-muted/40">
                      <img
                        src={photo}
                        alt="Attached preview"
                        className="max-h-56 w-full object-contain"
                      />
                      <div className="flex items-center justify-between gap-2 border-t border-border bg-card/90 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Preview — looks good?</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setPhoto(null)}
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <Button
                  className="w-full"
                  disabled={busy || Boolean(hold)}
                  onClick={() => void submit()}
                >
                  {busy
                    ? "Logging…"
                    : `Log · ${formatPoints(suggested)} for ${beneficiaryLabel}${
                        retrospective ? " (past day)" : ""
                      }`}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
