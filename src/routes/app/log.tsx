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

function LogPage() {
  const user = useCurrentUser();
  const dash = useDashboard(Boolean(user));
  const theme = dash.data?.profile.theme;
  const t = (s: string) => tone(s, theme);
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
  const [retrospective, setRetrospective] = useState(false);
  const [occurredOn, setOccurredOn] = useState(todayLocalISO());

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
          occurred_on:
            retrospective && occurredOn && occurredOn !== todayLocalISO()
              ? occurredOn
              : retrospective
                ? occurredOn
                : null,
        },
      });
      toast.success(
        retrospective
          ? "Logged for that day — still needs partner approval"
          : "Logged — waiting for partner approval",
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
              Be clear — this choice decides whose Brownie Points balance it lands on.
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
                Brownie Points apply to you after partner review
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
              <p className="mt-1 text-xs leading-snug">Brownie Points apply to {partnerLabel}</p>
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
                  "flex w-full min-w-0 items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{toneActionName(a.name, a.kind, theme, a.id)}</p>
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
              <CardTitle className="text-base">{toneActionName(selected.name, selected.kind, theme, selected.id)}</CardTitle>
              <CardDescription>
                Suggested {formatPoints(suggested)}
                {detail && selected.kind === "positive"
                  ? " (includes Attention to Detail +2)"
                  : ""}
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
                  <p className="text-xs text-muted-foreground">
                    Same as a normal log — still needs partner approval. The date is for your
                    shared history.
                  </p>
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
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm">
                  <ImageIcon className="h-4 w-4" />
                  {t("Gallery")}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      void (async () => {
                        try {
                          const dataUrl = await compressImageFile(file);
                          setPhoto(dataUrl);
                        } catch {
                          toast.error("Could not read that photo");
                        }
                      })();
                    }}
                  />
                </label>
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm">
                  <Camera className="h-4 w-4" />
                  {t("Camera")}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      void (async () => {
                        try {
                          const dataUrl = await compressImageFile(file);
                          setPhoto(dataUrl);
                        } catch {
                          toast.error("Could not read that photo");
                        }
                      })();
                    }}
                  />
                </label>
                {photo ? (
                  <button
                    type="button"
                    className="relative"
                    onClick={() => setPhoto(null)}
                    aria-label="Remove photo"
                  >
                    <img src={photo} alt="" className="h-11 w-11 rounded-xl object-cover" />
                  </button>
                ) : null}
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void submit()}>
                {busy
                  ? "Logging…"
                  : `Log · ${direction === "self" ? "What I did" : `What ${partnerLabel} did`}${
                      retrospective ? " (past day)" : ""
                    }`}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
