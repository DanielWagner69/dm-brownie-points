-- Mutual agreement on point modifications
alter table logged_actions
  add column if not exists proposed_points integer;

-- Expand status check to include modification_pending
alter table logged_actions drop constraint if exists logged_actions_status_check;
alter table logged_actions
  add constraint logged_actions_status_check
  check (status in ('pending', 'accepted', 'declined', 'modified', 'modification_pending'));
