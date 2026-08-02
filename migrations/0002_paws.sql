-- Pawmise: private couple accountability schema
-- user_id is TEXT (Better Auth ids)

create table if not exists profiles (
  user_id text primary key,
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  theme text not null default 'warm',
  partner_nickname text not null default '',
  notification_prefs jsonb not null default '{"actions":true,"rewards":true,"reviews":true,"summaries":true}'::jsonb,
  onboarding_step text not null default 'profile',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists couples (
  id text primary key,
  invite_code text not null unique,
  user_a text not null,
  user_b text,
  created_at timestamptz not null default now(),
  unpaired_at timestamptz
);

create unique index if not exists couples_user_a_active_idx
  on couples (user_a) where unpaired_at is null;
create unique index if not exists couples_user_b_active_idx
  on couples (user_b) where unpaired_at is null and user_b is not null;
create index if not exists couples_invite_code_idx on couples (invite_code);

create table if not exists action_types (
  id serial primary key,
  couple_id text not null references couples(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('positive', 'negative')),
  base_points integer not null,
  category text not null default 'general',
  is_default boolean not null default false,
  archived boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists action_types_couple_idx on action_types (couple_id);

create table if not exists action_preferences (
  id serial primary key,
  user_id text not null,
  action_type_id integer not null references action_types(id) on delete cascade,
  preferred_points integer not null,
  unique (user_id, action_type_id)
);

create table if not exists logged_actions (
  id text primary key,
  couple_id text not null references couples(id) on delete cascade,
  action_type_id integer references action_types(id) on delete set null,
  action_name text not null,
  kind text not null check (kind in ('positive', 'negative')),
  logged_by text not null,
  applies_to text not null,
  direction text not null check (direction in ('self', 'partner')),
  points integer not null,
  attention_to_detail boolean not null default false,
  note text not null default '',
  photo_data text,
  category text not null default 'general',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'modified')),
  decline_note text,
  editable_until timestamptz not null,
  review_until timestamptz not null,
  reviewed_at timestamptz,
  reviewed_by text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists logged_actions_couple_idx on logged_actions (couple_id, created_at desc);
create index if not exists logged_actions_applies_idx on logged_actions (applies_to, status);

create table if not exists rewards (
  id text primary key,
  couple_id text not null references couples(id) on delete cascade,
  created_by text not null,
  name text not null,
  description text not null default '',
  point_cost integer,
  cost_set_by text,
  repeatable boolean not null default true,
  kind text not null default 'gesture' check (kind in ('gesture', 'wishlist')),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists rewards_couple_idx on rewards (couple_id);

create table if not exists reward_claims (
  id text primary key,
  reward_id text not null references rewards(id) on delete cascade,
  couple_id text not null references couples(id) on delete cascade,
  claimed_by text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'cancelled', 'completed')),
  points_spent integer not null default 0,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists reward_claims_couple_idx on reward_claims (couple_id);

create table if not exists badges (
  user_id text not null,
  couple_id text not null,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, couple_id, badge_key)
);

create table if not exists streaks (
  couple_id text not null,
  user_id text not null,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_action_date date,
  primary key (couple_id, user_id)
);

create table if not exists deletion_requests (
  id text primary key,
  couple_id text not null references couples(id) on delete cascade,
  entry_type text not null check (entry_type in ('action', 'history_wipe')),
  entry_id text,
  requested_by text not null,
  approved_by text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  couple_id text not null,
  kind text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
