export type ThemeId = "warm" | "dusk" | "blossom" | "burgundy" | "flight" | "sky" | "naughty";

export type Profile = {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  theme: ThemeId;
  partner_nickname: string;
  notification_prefs: NotificationPrefs;
  onboarding_step: string;
  /** Both partners must enable for Edit mode to unlock settled-action edits */
  edit_mode: boolean;
};

export type NotificationPrefs = {
  actions: boolean;
  rewards: boolean;
  reviews: boolean;
  summaries: boolean;
};

export type Couple = {
  id: string;
  invite_code: string;
  user_a: string;
  user_b: string | null;
  partner_id: string | null;
  partner_name: string | null;
  partner_avatar: string | null;
  is_complete: boolean;
};

export type ActionCategory = {
  id: number;
  couple_id: string;
  name: string;
  archived: boolean;
  action_count?: number;
};

export type ActionType = {
  id: number;
  couple_id: string;
  name: string;
  kind: "positive" | "negative";
  base_points: number;
  category: string;
  is_default: boolean;
  archived: boolean;
  /** Partner's preferred points (use when YOU did the action — they received it) */
  preferred_points: number | null;
  /** Your preferred points (use when THEY did the action — you received it) */
  my_points?: number | null;
};

export type LoggedAction = {
  id: string;
  couple_id: string;
  action_type_id: number | null;
  action_name: string;
  kind: "positive" | "negative";
  logged_by: string;
  applies_to: string;
  /** Who performed / is tagged. "both" = shared moment (points still via applies_to). */
  direction: "self" | "partner" | "both";
  points: number;
  proposed_points?: number | null;
  proposed_note?: string | null;
  proposed_attention_to_detail?: boolean | null;
  /** Who proposed the pending tweak (other partner must agree) */
  edit_proposed_by?: string | null;
  /** Status before modification_pending (restored on decline) */
  status_before_mod?: string | null;
  attention_to_detail: boolean;
  note: string;
  photo_data: string | null;
  category: string;
  status:
    | "held"
    | "pending"
    | "accepted"
    | "declined"
    | "modified"
    | "modification_pending";
  decline_note: string | null;
  editable_until: string;
  review_until: string;
  held_until?: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  logger_name?: string;
  applies_name?: string;
};

export type DeletionRequest = {
  id: string;
  couple_id: string;
  entry_type: "action" | "history_wipe";
  entry_id: string | null;
  requested_by: string;
  status: "pending" | "approved" | "cancelled";
  created_at: string;
  requester_name?: string;
  action_name?: string | null;
};

export type Reward = {
  id: string;
  couple_id: string;
  created_by: string;
  name: string;
  description: string;
  point_cost: number | null;
  cost_set_by: string | null;
  repeatable: boolean;
  kind: "gesture" | "wishlist";
  archived: boolean;
  created_by_name?: string;
};

export type RewardClaim = {
  id: string;
  reward_id: string;
  couple_id: string;
  claimed_by: string;
  status: "pending" | "approved" | "cancelled" | "completed";
  points_spent: number;
  created_at: string;
  resolved_at: string | null;
  reward_name?: string;
  claimer_name?: string;
};

export type Balance = {
  current: number;
  lifetime_positive: number;
  lifetime_negative: number;
  points_spent: number;
};

export type Badge = {
  badge_key: string;
  title: string;
  description: string;
  earned_at: string;
};

export type TreatTip = {
  summary: string;
  items: { name: string; cost: number }[];
  total: number;
};

export type HomeStats = {
  week_positive: number;
  week_negative: number;
  week_accepted: number;
  week_pending: number;
  month_logged: number;
  pending_reviews: number;
  pending_claims: number;
  pending_modifications: number;
};

export type Dashboard = {
  profile: Profile;
  couple: Couple | null;
  partner: Profile | null;
  balance: Balance;
  partnerBalance: Balance | null;
  streak: number;
  badges: Badge[];
  pendingReviews: LoggedAction[];
  /** Modifications your partner proposed — you must agree */
  pendingModifications: LoggedAction[];
  pendingClaims: RewardClaim[];
  /** Delete requests your partner started — you must agree */
  pendingDeletions: DeletionRequest[];
  /** Your own held logs still in the 30s grace window */
  heldActions: LoggedAction[];
  recent: LoggedAction[];
  treatTips: TreatTip[];
  weeklySummary: string;
  stats: HomeStats;
  /** True only when both partners have edit_mode enabled */
  editModeActive: boolean;
  notifications: { id: string; title: string; body: string; read: boolean; created_at: string }[];
};
