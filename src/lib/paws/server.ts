import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  DEFAULT_ACTIONS,
  STARTER_REWARDS,
  BADGE_DEFS,
  PREFERENCE_SAMPLES,
  REMOVED_DEFAULT_ACTIONS,
  RENAMED_DEFAULT_ACTIONS,
  ACTION_CATEGORIES,
  type BadgeStats,
} from "./defaults";

import type {
  ActionCategory,
  ActionType,
  Balance,
  Couple,
  Dashboard,
  DeletionRequest,
  LoggedAction,
  Profile,
  Reward,
  RewardClaim,
  ThemeId,
} from "./types";
import { clampBasePoints, clampLoggedPoints, hoursFromNow, id, inviteCode } from "@/lib/utils";

type Ctx = { userId: string };

async function getProfile(userId: string): Promise<Profile | null> {
  const sql = await getSql();
  const rows = await sql<Profile>`
    select user_id, display_name, bio, avatar_url, theme, partner_nickname,
           notification_prefs, onboarding_step,
           coalesce(edit_mode, false) as edit_mode
    from profiles where user_id = ${userId}`;
  if (!rows[0]) return null;
  const p = rows[0];
  if (typeof p.notification_prefs === "string") {
    p.notification_prefs = JSON.parse(p.notification_prefs as unknown as string);
  }
  p.edit_mode = Boolean(p.edit_mode);
  return p;
}
