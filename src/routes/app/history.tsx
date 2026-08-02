import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { AppShell } from "@/components/paws/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboard, useHistory, useInvalidatePaws } from "@/lib/paws/hooks";
import {
  editLoggedAction,
  exportHistory,
  requestDeleteAction,
  resolveModification,
  reviewAction,
} from "@/lib/paws/server";
import { downloadText, formatPoints } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { tone, toneActionName } from "@/lib/paws/tone";

export const Route = createFileRoute("/app/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const user = useCurrentUser();
  const dash = useDashboard(Boolean(user));
  const theme = dash.data?.profile.theme;
  const t = (s: string) => tone(s, theme);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const history = useHistory(
    { search: search || undefined, kind: kind || undefined, status: status || undefined },
    Boolean(user),
  );
  const invalidate = useInvalidatePaws();

  return (
    <AppShell title={t("Your story")} subtitle={t("Searchable shared history")}>
      <div className="space-y-3">
        <Input
          placeholder="Search notes, actions, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={!kind ? "default" : "outline"} onClick={() => setKind("")}>
            All kinds
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
          <Button
            size="sm"
            variant={status === "pending" ? "default" : "outline"}
            onClick={() => setStatus(status === "pending" ? "" : "pending")}
          >
            Pending
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              const { csv } = await exportHistory();
              downloadText(`pawmise-history-${Date.now()}.csv`, csv);
              toast.success("Exported CSV");
            }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const res = await requestDeleteAction({
                data: { entry_type: "history_wipe" },
              });
              toast.message(
                res.status === "approved"
                  ? "History wiped (both agreed)"
                  : "Wipe requested — partner must agree",
              );
              invalidate();
            }}
          >
            Request full wipe
          </Button>
        </div>

        <div className="space-y-2 pb-4">
          {(history.data ?? []).map((a) => {
            const canEdit =
              user &&
              a.logged_by === user.id &&
              a.status !== "declined" &&
              a.status !== "modification_pending" &&
              new Date(a.editable_until).getTime() > Date.now();
            const canReview =
              user && a.logged_by !== user.id && a.status === "pending" && !a.archived;
            const canConfirmMod =
              user && a.logged_by === user.id && a.status === "modification_pending";

            return (
              <article
                key={a.id}
                className="min-w-0 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug break-words">{toneActionName(a.action_name, a.kind, theme, a.id)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.logger_name} → {a.applies_name} · {a.category} ·{" "}
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-sm font-semibold tabular ${
                        a.points >= 0 ? "text-positive" : "text-danger"
                      }`}
                    >
                      {formatPoints(a.points)}
                    </span>
                    {a.status === "modification_pending" && a.proposed_points != null ? (
                      <span className="text-xs text-primary tabular">
                        proposed {formatPoints(a.proposed_points)}
                      </span>
                    ) : null}
                    <Badge
                      variant={
                        a.status === "pending" || a.status === "modification_pending"
                          ? "pending"
                          : a.status === "declined"
                            ? "negative"
                            : "soft"
                      }
                    >
                      {a.status === "modification_pending" ? "tweak pending" : a.status}
                    </Badge>
                  </div>
                </div>
                {a.note ? (
                  <p className="mt-2 text-sm text-muted-foreground">{a.note}</p>
                ) : null}
                {a.attention_to_detail ? (
                  <p className="mt-1 text-xs font-medium text-primary">Attention to Detail</p>
                ) : null}
                {a.photo_data ? (
                  <img
                    src={a.photo_data}
                    alt=""
                    className="mt-2 max-h-40 rounded-2xl object-cover"
                  />
                ) : null}
                {a.decline_note ? (
                  <p className="mt-2 text-xs text-danger">Declined: {a.decline_note}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {canReview ? (
                    <>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await reviewAction({ data: { id: a.id, decision: "accept" } });
                            toast.success("Accepted");
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
                          const pts = window.prompt(
                            "Propose new Brownie Points?",
                            String(a.points),
                          );
                          if (pts == null) return;
                          try {
                            await reviewAction({
                              data: {
                                id: a.id,
                                decision: "modify",
                                points: Number(pts),
                              },
                            });
                            toast.success("Sent for their agreement");
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
                            toast.message("Declined");
                            invalidate();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                      >
                        Decline
                      </Button>
                    </>
                  ) : null}

                  {canConfirmMod ? (
                    <>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await resolveModification({
                              data: { id: a.id, decision: "accept" },
                            });
                            toast.success("You both agreed");
                            invalidate();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                      >
                        Agree to {formatPoints(a.proposed_points ?? a.points)}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await resolveModification({
                              data: { id: a.id, decision: "reject" },
                            });
                            toast.message("Kept original score");
                            invalidate();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                      >
                        Keep original
                      </Button>
                    </>
                  ) : null}

                  {canEdit ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const pts = window.prompt("Edit Brownie Points", String(a.points));
                        if (pts == null) return;
                        try {
                          await editLoggedAction({
                            data: { id: a.id, points: Number(pts) },
                          });
                          toast.success("Updated within 24h window");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Edit failed");
                        }
                      }}
                    >
                      Edit (24h)
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const res = await requestDeleteAction({
                        data: { entry_type: "action", entry_id: a.id },
                      });
                      toast.message(
                        res.status === "approved"
                          ? "Deleted (both agreed)"
                          : "Delete requested — partner must agree",
                      );
                      invalidate();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </article>
            );
          })}
          {(history.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No entries yet.</p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
