import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/paws/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboard, useHistory, useInvalidatePaws } from "@/lib/paws/hooks";
import {
  addActionReply,
  editLoggedAction,
  exportHistory,
  proposeEditAction,
  requestDeleteAction,
  resolveModification,
  reviewAction,
} from "@/lib/paws/server";
import { cn, downloadText, formatPoints } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { tone, toneActionName } from "@/lib/paws/tone";
import type { LoggedAction } from "@/lib/paws/types";

export const Route = createFileRoute("/app/history")({
  component: HistoryPage,
});

function performerTag(
  a: LoggedAction,
  userId: string | undefined,
): "me" | "them" | "both" {
  if (a.direction === "both") return "both";
  if (!userId) return "them";
  return a.applies_to === userId ? "me" : "them";
}

function performerLabel(
  a: LoggedAction,
  userId: string | undefined,
  myName: string,
  partnerName: string,
): string {
  if (a.direction === "both") return "Both of you";
  if (a.applies_to === userId) return myName;
  return partnerName;
}

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

  const editModeActive = Boolean(dash.data?.editModeActive);
  const myName = dash.data?.profile.display_name ?? "You";
  const partnerName =
    dash.data?.couple?.partner_name ||
    dash.data?.profile.partner_nickname ||
    "Partner";

  return (
    <AppShell title={t("Your story")} subtitle={t("Searchable shared history")}>
      <div className="space-y-3">
        {editModeActive ? (
          <p className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs leading-snug text-muted-foreground">
            <span className="font-medium text-primary">Edit mode is on.</span> On
            accepted entries you can propose changes to points, note, or who it
            applies to — partner must agree.
          </p>
        ) : null}

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
        </div>

        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--partner-me)]" />
            {myName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--partner-them)]" />
            {partnerName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--partner-both)]" />
            Both
          </span>
        </div>

        <div className="space-y-2 pb-4">
          {(history.data ?? []).map((a) => {
            const tag = performerTag(a, user?.id);
            const canEdit24h =
              user &&
              a.logged_by === user.id &&
              a.status !== "declined" &&
              a.status !== "modification_pending" &&
              (a.status === "held" || new Date(a.editable_until).getTime() > Date.now());
            const canProposeEdit =
              editModeActive &&
              user &&
              (a.status === "accepted" || a.status === "modified") &&
              a.status !== "modification_pending";
            const canReview =
              user && a.logged_by !== user.id && a.status === "pending" && !a.archived;
            const canConfirmMod =
              user &&
              a.status === "modification_pending" &&
              (a.edit_proposed_by
                ? a.edit_proposed_by !== user.id
                : a.logged_by === user.id);
            const canReply =
              user &&
              a.logged_by !== user.id &&
              !a.reply_note &&
              a.status !== "held" &&
              a.status !== "declined" &&
              !a.archived;

            return (
              <article
                key={a.id}
                className={cn(
                  "min-w-0 overflow-hidden rounded-3xl border border-border p-4 shadow-sm",
                  tag === "me" && "action-tag-me",
                  tag === "them" && "action-tag-them",
                  tag === "both" && "action-tag-both",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug break-words">
                      {toneActionName(a.action_name, a.kind, theme, a.id)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.logger_name} logged · applies to{" "}
                      <span className="font-medium text-foreground">
                        {performerLabel(a, user?.id, myName, partnerName)}
                      </span>{" "}
                      · {a.category} · {new Date(a.created_at).toLocaleString()}
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
                          : a.status === "held"
                            ? "soft"
                            : a.status === "declined"
                              ? "negative"
                              : "soft"
                      }
                    >
                      {a.status === "modification_pending"
                        ? "tweak pending"
                        : a.status === "held"
                          ? "sending soon"
                          : a.status}
                    </Badge>
                  </div>
                </div>
                {a.note ? (
                  <p className="mt-2 text-sm text-muted-foreground">{a.note}</p>
                ) : null}
                {a.reply_note ? (
                  <div className="mt-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
                      Reply{a.reply_by_name ? ` · ${a.reply_by_name}` : ""}
                    </p>
                    <p className="mt-0.5 text-sm text-foreground">{a.reply_note}</p>
                  </div>
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

                  {canEdit24h ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const pts = window.prompt("Edit Brownie Points", String(a.points));
                        if (pts == null) return;
                        const dir = window.prompt(
                          "Who is this about? (self / partner / both)",
                          a.direction,
                        );
                        if (dir == null) return;
                        const direction =
                          dir.trim().toLowerCase() === "both"
                            ? "both"
                            : dir.trim().toLowerCase() === "partner"
                              ? "partner"
                              : "self";
                        try {
                          await editLoggedAction({
                            data: {
                              id: a.id,
                              points: Number(pts),
                              direction,
                            },
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

                  {canProposeEdit ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const pts = window.prompt(
                          "Propose new Brownie Points",
                          String(a.points),
                        );
                        if (pts == null) return;
                        const note = window.prompt(
                          "Propose note (leave blank to keep)",
                          a.note,
                        );
                        if (note == null) return;
                        const dir = window.prompt(
                          "Who is this about? (self / partner / both)",
                          a.direction,
                        );
                        if (dir == null) return;
                        const direction =
                          dir.trim().toLowerCase() === "both"
                            ? "both"
                            : dir.trim().toLowerCase() === "partner"
                              ? "partner"
                              : dir.trim().toLowerCase() === "self"
                                ? "self"
                                : a.direction;
                        try {
                          await proposeEditAction({
                            data: {
                              id: a.id,
                              points: Number(pts),
                              note: note.trim() || a.note,
                              direction,
                            },
                          });
                          toast.success("Edit proposed — partner needs to agree");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Could not propose");
                        }
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Propose edit
                    </Button>
                  ) : null}

                  {canReply ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const note = window.prompt("Soft reply to this entry?");
                        if (!note?.trim()) return;
                        try {
                          await addActionReply({ data: { id: a.id, note: note.trim() } });
                          toast.success("Reply added");
                          invalidate();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Could not reply");
                        }
                      }}
                    >
                      Reply
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
                          : "Delete requested — partner will see it on Nest home to agree",
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
