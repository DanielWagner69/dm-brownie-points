-- Allow actions tagged as involving both partners (visual + history tag).
-- Points still attribute to applies_to; "both" is for colouring & meaning.

alter table logged_actions
  drop constraint if exists logged_actions_direction_check;

alter table logged_actions
  add constraint logged_actions_direction_check
  check (direction in ('self', 'partner', 'both'));
