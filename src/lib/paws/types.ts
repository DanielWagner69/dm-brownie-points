export type ThemeId = "warm" | "dusk" | "blossom" | "burgundy" | "flight";

export type Profile = {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  theme: ThemeId;
  partner_nickname: string;
  notification_prefs: NotificationPrefs;
  onboarding_step: string;
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

export type ActionType = {
  id: number;
  couple_id: string;
  name: string;
  kind: "positive" | "negative";
  base_points: number;
  category: string;
  is_default: boolean;
  archived: boolean;
  preferred_points: number | null;
};

export type LoggedAction = {
  id: string;
  couple_id: string;
  action_type_id: number | null;
  action_name: string;
  kind: "positive" | "negative";
  logged_by: string;
  applies_to: string;
  direction: "self" | "partner";
  points: number;
  attention_to_detail: boolean;
  note: string;
  photo_data: string | null;
  category: string;
  status: "pending" | "accepted" | "declined" | "modified";
  decline_note: string | null;
  editable_until: string;
  review_until: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  logger_name?: string;
  applies_name?: string;
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

export type Dashboard = {
  profile: Profile;
  couple: Couple | null;
  partner: Profile | null;
  balance: Balance;
  partnerBalance: Balance | null;
  streak: number;
  badges: Badge[];
  pendingReviews: LoggedAction[];
  pendingClaims: RewardClaim[];
  recent: LoggedAction[];
  weeklySummary: string;
  notifications: { id: string; title: string; body: string; read: boolean; created_at: string }[];
};
