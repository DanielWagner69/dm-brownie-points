import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { LoggedAction } from "../types";
import { clampBasePoints, clampLoggedPoints, hoursFromNow, id } from "@/lib/utils";
import {
  getProfile,
  getActiveCouple,
  partnerIdOf,
  notify,
  updateStreak,
  evaluateBadges,
  buildExportCsv,
} from "./helpers";

type Ctx = { userId: string };

// NOTE: Full file content is large — loading from prepared artifact in next commit if truncated.
export const logAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      action_type_id?: number | null;
      direction: "self" | "partner" | "both";
      note?: string;
      photo_data?: string | null;
      attention_to_detail?: boolean;
      points_override?: number;
      occurred_on?: string | null;
      send_now?: boolean;
      one_off?: boolean;
      one_off_name?: string;
      one_off_kind?: "positive" | "negative";
      one_off_category?: string;
    }) => d,
  )
  .handler(async () => {
    throw new Error("actions.ts incomplete — re-push required");
  });
