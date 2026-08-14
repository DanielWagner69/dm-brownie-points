-- Custom action categories per nest + web-push subscriptions

create table if not exists action_categories (
  id serial primary key,
  couple_id text not null references couples(id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists action_categories_couple_name_idx
  on action_categories (couple_id, lower(name))
  where archived = false;

create table if not exists app_config (
  key text primary key,
  value text not null
);

create table if not exists push_subscriptions (
  id text primary key,
  user_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);
