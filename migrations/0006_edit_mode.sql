-- Dual Edit mode (both partners must enable) + richer modification proposals

alter table profiles
  add column if not exists edit_mode boolean not null default false;

alter table logged_actions
  add column if not exists proposed_note text;

alter table logged_actions
  add column if not exists proposed_attention_to_detail boolean;

alter table logged_actions
  add column if not exists edit_proposed_by text;

alter table logged_actions
  add column if not exists status_before_mod text;
