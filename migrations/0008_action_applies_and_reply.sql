-- Action library: which partner(s) an action can be raised against.
-- 'both' = either partner; 'user_a' / 'user_b' = only that couple member.
alter table action_types
  add column if not exists applies_to text not null default 'both';

-- Backfill + constraint (safe if column already existed from a partial run)
update action_types set applies_to = 'both' where applies_to is null or applies_to = '';

alter table action_types
  drop constraint if exists action_types_applies_to_check;

alter table action_types
  add constraint action_types_applies_to_check
  check (applies_to in ('both', 'user_a', 'user_b'));

-- Partner reply on a logged action (the non-logger can leave a soft reply)
alter table logged_actions
  add column if not exists reply_note text;

alter table logged_actions
  add column if not exists reply_by text;

alter table logged_actions
  add column if not exists reply_at timestamptz;
