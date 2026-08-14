/**
 * Public API for paws server functions.
 * Re-exports from modular files so existing imports keep working:
 *   import { getDashboard, updateProfile, ... } from "@/lib/paws/server"
 */
export {
  getMe,
  updateProfile,
} from "./server/profile";

export {
  createInvite,
  joinWithCode,
  unpair,
} from "./server/pairing";

export {
  savePreferences,
  listActionTypes,
  listMyPreferenceTargets,
  upsertActionType,
  listCategories,
  upsertCategory,
} from "./server/catalog";

export {
  getPushPublicKey,
  getPushStatus,
  savePushSubscription,
  removePushSubscription,
} from "./server/push";

export {
  logAction,
  releaseHeldAction,
  cancelHeldAction,
  reviewAction,
  resolveModification,
  proposeEditAction,
  editLoggedAction,
  listHistory,
  exportHistory,
  requestDeleteAction,
  respondToDeletion,
  addActionReply,
} from "./server/actions";

export {
  listRewards,
  upsertReward,
  claimReward,
  resolveClaim,
  buyWishlistItem,
} from "./server/rewards";

export {
  getDashboard,
  markNotificationsRead,
  settleExpired,
} from "./server/dashboard";
