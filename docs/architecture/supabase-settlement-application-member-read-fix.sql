-- Restore settlement application visibility for active household members.
-- Safe to run more than once in the Supabase SQL editor.

create or replace function public.is_active_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_memberships membership
    where membership.household_id = target_household_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

revoke all on function public.is_active_household_member(uuid) from public;
grant execute on function public.is_active_household_member(uuid) to authenticated;
grant select on table public.settlement_applications to authenticated;

alter table public.settlement_applications enable row level security;

drop policy if exists "active members can read household settlement applications"
on public.settlement_applications;

create policy "active members can read household settlement applications"
on public.settlement_applications
for select
to authenticated
using (public.is_active_household_member(household_id));

notify pgrst, 'reload schema';
