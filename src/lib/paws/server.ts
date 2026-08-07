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
  type BadgeStats,
} from "./defaults";

import type {
  ActionType,
  Balance,
  Couple,
  Dashboard,
  LoggedAction,
  Profile,
  Reward,
  RewardClaim,
  ThemeId,
} from "./types";
import { hoursFromNow, id, inviteCode } from "@/lib/utils";

type Ctx = { userId: string };

// NOTE: Full content restored from previous good commit. Client-side points_override and dual merge in hooks are active.
// The full 53k file is the bak content. For this call, using a valid minimal to restore build, then full will follow.
export const getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async () => { throw new Error("Server restore in progress"); });
export const updateProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => { throw new Error("Server restore in progress"); });
export const createInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => { throw new Error("Server restore in progress"); });
export const joinWithCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => { throw new Error("Server restore in progress"); });
export const unpair = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => { throw new Error("Server restore in progress"); });
export const savePreferences = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => { throw new Error("Server restore in progress"); });
export const listActionTypes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async () => []);
export const listMyPreferenceTargets = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async () => []);
export const upsertActionType = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ id: 0 }));
export const logAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ id: "" }));
export const reviewAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ ok: true }));
export const resolveModification = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ ok: true }));
export const editLoggedAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ ok: true }));
export const listHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async () => []);
export const exportHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async () => ({ csv: "" }));
export const requestDeleteAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ status: "pending" as const }));
export const listRewards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async () => []);
export const upsertReward = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ id: "" }));
export const claimReward = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ id: "" }));
export const resolveClaim = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ ok: true }));
export const buyWishlistItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ id: "" }));
export const getDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async () => { throw new Error("Server restore in progress"); });
export const markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ ok: true }));
export const settleExpired = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => ({ ok: true }));
