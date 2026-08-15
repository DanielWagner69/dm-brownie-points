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
  logAction,
  releaseHeldAction,
  upsertActionType,
} from "@/lib/paws/server";
import { clampBasePoints, cn, formatPoints } from "@/lib/utils";
import { compressImageFile } from "@/lib/paws/image";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { tone, toneActionName } from "@/lib/paws/tone";
import type { ActionType } from "@/lib/paws/types";
import { suggestActions } from "@/lib/paws/fuzzy";

export const Route = createFileRoute("/app/log")({
  component: LogPage,
});

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
  points: number;
  held_until: string;
};

function LogPage() {
  const user = useCurrentUser();
  const dash = useDashboard(Boolean(user));
  const types = useActionTypes(Boolean(user));
  const cats = useCategories(Boolean(user));
  const invalidate = useInvalidatePaws();

  const [direction, setDirection] = useState<"self" | "partner">("partner");
  const [kind, setKind] = useState<"all" | "positive" | "negative">("all");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ActionType | null>(null);
  const [detail, setDetail] = useState(false);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hold, setHold] = useState<HoldState | null>(null);
  const [retrospective, setRetrospective] = useState(false);
  const [occurredOn, setOccurredOn] = useState("");
  const [creating, setCreating] = useState(false);
  const [openQuick, setOpenQuick] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<"positive" | "negative">("positive");
  const [newCategory, setNewCategory] = useState("general");
  const [newPts, setNewPts] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = dash.data?.profile.theme;
  const t = (s: string) => tone(s, theme);
  const partnerLabel =
    dash.data?.couple?.partner_name ||
    dash.data?.profile.partner_nickname ||
    "Partner";

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const c of cats.data ?? []) set.add(c.name);
    for (const a of types.data ?? []) if (a.category) set.add(a.category);
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

  const basePts = selected ? pointsForDirection(selected, direction) : 0;
  const suggested =
    selected && detail && selected.kind === "positive" ? basePts + 2 : basePts;

  const beneficiaryLabel = direction === "self" ? "you" : partnerLabel;

  useEffect(() => {
    if (!hold) {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      return;
    }
    const remaining = new Date(hold.held_until).getTime() - Date.now();
    if (remaining <= 0) {
      void releaseHeldAction({ data: { id: hold.id } }).then(() => {
        setHold(null);
        invalidate();
        toast.success("Sent to partner");
      });
      return;
    }
    holdTimer.current = setTimeout(() => {
      void releaseHeldAction({ data: { id: hold.id } }).then(() => {
        setHold(null);
        invalidate();
        toast.success("Sent to partner");
      });
    }, remaining);
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, [hold, invalidate]);

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
          points: suggested,
          held_until: res.held_until,
        });
        toast.message("30s to cancel before it reaches them");
      } else {
        toast.success("Logged");
      }
      setSelected(null);
      setNote("");
      setPhoto(null);
      setDetail(false);
      setRetrospective(false);
      setOccurredOn("");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log");
    } finally {
      setBusy(false);
    }
  }

  async function createAndSelect() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const base = clampBasePoints(newKind === "negative" ? -Math.abs(newPts) : Math.abs(newPts));
      let applies_to: "both" | "user_a" | "user_b" = "both";
      if (couple?.user_a && couple?.user_b && user?.id) {
        const meSide = couple.user_a === user.id ? "user_a" : "user_b";
        const themSide = couple.user_a === user.id ? "user_b" : "user_a";
        applies_to = direction === "self" ? meSide : themSide;
      }
      const { id } = await upsertActionType({
        data: {
          name: newName.trim(),
          kind: newKind,
          base_points: base,
          category: newCategory,
          applies_to,
        },
      });
      invalidate();
      const refreshed = await types.refetch();
      const created = (refreshed.data ?? []).find((a) => a.id === id);
      if (created) {
        setSelected(created);
      } else {
        setSelected({
          id,
          couple_id: couple?.id ?? "",
          name: newName.trim(),
          kind: newKind,
          base_points: base,
          category: newCategory || "general",
          is_default: false,
          archived: false,
          applies_to,
          preferred_points: base,
          my_points: base,
        });
      }
      setNewName("");
      setNewPts(1);
      toast.success("Action added to your nest");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create");
    } finally {
      setCreating(false);
    }
  }

  async function logOneOff() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const base = clampBasePoints(newKind === "negative" ? -Math.abs(newPts) : Math.abs(newPts));
      const res = await logAction({
        data: {
          one_off: true,
          one_off_name: newName.trim(),
          one_off_kind: newKind,
          one_off_category: newCategory || "general",
          direction,
          note: "",
          points_override: base,
          attention_to_detail: false,
          occurred_on: retrospective && occurredOn ? occurredOn : null,
        },
      });
      if (res.status === "held" && res.held_until) {
        setHold({
          id: res.id,
          name: newName.trim(),
          points: base,
          held_until: res.held_until,
        });
        toast.message("30s to cancel before it reaches them");
      } else {
        toast.success("One-off logged");
      }
      setNewName("");
      setNewPts(1);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log one-off");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell title={t("Log a moment")} subtitle={t("Raise for you or them")}>
      <div className="space-y-4 pb-6">
        {hold ? (
          <Card className="border-primary/40 bg-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sending soon</CardTitle>
              <CardDescription>
                {hold.name} · {formatPoints(hold.points)} — cancel within 30s if you change your mind.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  try {
                    await cancelHeldAction({ data: { id: hold.id } });
                    setHold(null);
                    toast.message("Cancelled");
                    invalidate();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not cancel");
                  }
                }}
              >
                <Undo2 className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  try {
                    await releaseHeldAction({ data: { id: hold.id } });
                    setHold(null);
                    toast.success("Sent now");
                    invalidate();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not send");
                  }
                }}
              >
                <Send className="h-4 w-4" />
                Send now
              </Button>
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
                {partnerLabel}'s rating.
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
              <p className="text-sm font-semibold text-foreground">{t("What they did")}</p>
              <p className="mt-1 text-xs leading-snug">
                Points go to <span className="font-medium text-foreground">{partnerLabel}</span>.{" "}
                Value from your rating.
              </p>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setOpenQuick((v) => !v)}
          >
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Quick custom</CardTitle>
              <span className="text-xs text-muted-foreground">
                {openQuick ? "Hide" : "Show"}
              </span>
            </div>
            <CardDescription>
              One-off or permanent. New actions inherit the current “who”.
              {!openQuick ? (
                <span className="mt-1 block text-primary">Tap to expand</span>
              ) : null}
            </CardDescription>
          </CardHeader>
          {openQuick ? (
          <CardContent className="space-y-3">
            <Input
              placeholder='e.g. "Masha cooked a meal"'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            {fuzzySuggestions.length > 0 && newName.trim() ? (
              <div className="flex flex-wrap gap-1.5">
                {fuzzySuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs"
                    onClick={() => {
                      setSelected(s);
                      setNewName("");
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
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
                value={newPts}
                onValueChange={setNewPts}
                allowNegative={false}
              />
              <select
                className="rounded-xl border border-border bg-surface px-2 text-sm"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                {availableCategories.length
                  ? availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))
                  : (
                      <option value="general">general</option>
                    )}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                disabled={!newName.trim() || creating}
                onClick={() => void createAndSelect()}
              >
                <Plus className="h-4 w-4" />
                {creating ? "Adding…" : "Create & select"}
              </Button>
              <Button
                variant="outline"
                disabled={!newName.trim() || creating}
                onClick={() => void logOneOff()}
              >
                {creating ? "Logging…" : "Log as one-off"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              One-off logs the points once and does not add the action to your permanent library.
            </p>
          </CardContent>
          ) : null}
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={kind === "all" ? "default" : "outline"} onClick={() => setKind("all")}>
            All
          </Button>
          <Button
            size="sm"
            variant={kind === "positive" ? "default" : "outline"}
            onClick={() => setKind("positive")}
          >
            Positive
          </Button>
          <Button
            size="sm"
            variant={kind === "negative" ? "default" : "outline"}
            onClick={() => setKind("negative")}
          >
            Negative
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={!category ? "default" : "outline"}
            onClick={() => setCategory("")}
          >
            All groups
          </Button>
          {availableCategories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
              className="capitalize"
            >
              {c}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("Search actions…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {direction === "self"
            ? `Showing actions that apply to you · points from ${partnerLabel}'s rating.`
            : `Showing actions that apply to ${partnerLabel} · points from your rating.`}
        </p>

        <div className="space-y-2">
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setSelected(a);
                setDetail(false);
                setNote("");
                setPhoto(null);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-3 py-3 text-left transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <p className="font-medium leading-snug break-words">
                  {toneActionName(a.name, a.kind, theme, a.id)}
                </p>
                <p className="text-[11px] capitalize text-muted-foreground">
                  {a.kind} · {a.category || "general"}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular",
                  pointsForDirection(a, direction) >= 0 ? "text-positive" : "text-danger",
                )}
              >
                {formatPoints(pointsForDirection(a, direction))}
              </span>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No matching actions for this direction. Create one below or switch who it’s about.
            </p>
          ) : null}
        </div>

        {selected ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center">
            <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base leading-snug">
                    {toneActionName(selected.name, selected.kind, theme, selected.id)}
                  </CardTitle>
                  <CardDescription>
                    For {beneficiaryLabel} · {formatPoints(suggested)}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {selected.kind === "positive" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={detail}
                      onChange={(e) => setDetail(e.target.checked)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    Attention to Detail (+2)
                  </label>
                ) : null}

                <div className="space-y-1.5">
                  <Label>Optional note</Label>
                  <Textarea
                    placeholder={t("Optional soft context…")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    Photo
                  </Button>
                  <input
                    ref={fileRef}
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
                        toast.error("Could not read photo");
                      }
                    }}
                  />
                  {photo ? (
                    <Button size="sm" variant="ghost" onClick={() => setPhoto(null)}>
                      <ImageIcon className="h-4 w-4" />
                      Clear photo
                    </Button>
                  ) : null}
                </div>
                {photo ? (
                  <img src={photo} alt="" className="max-h-40 rounded-2xl object-cover" />
                ) : null}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={retrospective}
                    onChange={(e) => setRetrospective(e.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Happened on a past day
                </label>
                {retrospective ? (
                  <Input
                    type="date"
                    value={occurredOn}
                    max={new Date().toISOString().slice(0, 10)}
                    min={yearsAgoLocalISO(2)}
                    onChange={(e) => setOccurredOn(e.target.value)}
                  />
                ) : null}

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
