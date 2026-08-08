-- Held logs: 30s grace before partner is notified / can review
alter table logged_actions
  add column if not exists held_until timestamptz;

alter table logged_actions drop constraint if exists logged_actions_status_check;
alter table logged_actions
  add constraint logged_actions_status_check
  check (status in (
    'held',
    'pending',
    'accepted',
    'declined',
    'modified',
    'modification_pending'
  ));
