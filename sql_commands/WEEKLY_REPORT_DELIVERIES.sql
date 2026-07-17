-- ==========================================
-- Weekly performance report delivery audit
-- ==========================================

begin;

create table if not exists public.weekly_report_deliveries (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  client_id text not null,
  sub_division text not null default 'General',
  recipients text[] not null default '{}',
  cc_recipients text[] not null default '{}',
  deep_link text,
  summary_json jsonb,
  status text not null default 'sent'
    check (status in ('sent', 'skipped', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  unique (week_start, client_id, sub_division)
);

create index if not exists idx_weekly_report_deliveries_week
  on public.weekly_report_deliveries (week_start desc);

alter table public.weekly_report_deliveries enable row level security;

drop policy if exists "weekly_report_deliveries_select_admin" on public.weekly_report_deliveries;
create policy "weekly_report_deliveries_select_admin"
on public.weekly_report_deliveries
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'general_manager', 'manager')
  )
);

-- Inserts are performed by the Edge Function using the service role (bypasses RLS).

commit;
