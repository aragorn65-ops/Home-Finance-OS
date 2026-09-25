-- Member/viewer read protection. Admin snapshot scope stays unchanged.
-- No financial rows are modified. Apply only this targeted migration.
begin;

create or replace function public.hfos_can_read_transaction(target_id uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.transactions t
    join public.household_memberships m on m.household_id = t.household_id
      and m.user_id = auth.uid() and m.status = 'active'
    where t.id = target_id and (
      m.role in ('owner', 'admin') or t.visibility = 'household'
      or m.member_id in (t.created_by_member_id, t.paid_by_member_id)
      or (t.visibility = 'participants' and exists (
        select 1 from public.expense_allocations a
        where a.household_id = t.household_id and a.transaction_id = t.id
          and a.member_id = m.member_id and a.is_included
      ))
    )
  );
$fn$;

create or replace function public.hfos_can_read_provider_bill(target_id uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.utility_provider_bills b
    join public.household_memberships m on m.household_id = b.household_id
      and m.user_id = auth.uid() and m.status = 'active'
    join public.household_members member on member.id = m.member_id
      and member.household_id = b.household_id
    where b.id = target_id and (
      m.role in ('owner', 'admin') or b.visibility = 'household'
      or m.member_id = b.paid_by_member_id
      or (b.visibility = 'participants' and exists (
        select 1 from jsonb_array_elements(
          case when jsonb_typeof(b.member_share_snapshot) = 'array'
            then b.member_share_snapshot else '[]'::jsonb end
        ) share
        where share ->> 'memberId' in (member.id::text, member.local_record_id)
      ))
    )
  );
$fn$;
revoke all on function public.hfos_can_read_transaction(uuid) from public;
revoke all on function public.hfos_can_read_provider_bill(uuid) from public;
grant execute on function public.hfos_can_read_transaction(uuid) to authenticated;
grant execute on function public.hfos_can_read_provider_bill(uuid) to authenticated;

-- Guard against applying to an unexpected deployment.
do $patch$
declare
  oid_value oid;
  definition text;
  anchor text;
  replacement text;
  pair text[];
  pairs text[][] := array[
    array['where remote_account.household_id = target_household_id',
      'where remote_account.household_id = target_household_id
          and (public.is_household_admin(target_household_id)
            or remote_account.visibility = ''household''
            or remote_account.owner_member_id = current_member_id)'],
    array['where remote_transaction.household_id = target_household_id',
      'where remote_transaction.household_id = target_household_id
          and public.hfos_can_read_transaction(remote_transaction.id)'],
    array['where remote_allocation.household_id = target_household_id',
      'where remote_allocation.household_id = target_household_id
          and public.hfos_can_read_transaction(remote_allocation.transaction_id)'],
    array['where remote_provider_bill.household_id = target_household_id',
      'where remote_provider_bill.household_id = target_household_id
          and public.hfos_can_read_provider_bill(remote_provider_bill.id)']
  ];
begin
  oid_value := to_regprocedure('public.load_household_core_snapshot(uuid)');
  if oid_value is null then raise exception 'Snapshot reader not found; nothing applied.'; end if;
  definition := replace(pg_get_functiondef(oid_value), E'\r\n', E'\n');
  foreach pair slice 1 in array pairs loop
    anchor := pair[1];
    replacement := replace(pair[2], E'\r\n', E'\n');
    if strpos(definition, replacement) > 0 then continue; end if;
    if (length(definition) - length(replace(definition, anchor, ''))) <> length(anchor) then
      raise exception 'Unexpected snapshot definition; nothing applied.';
    end if;
    definition := replace(definition, anchor, replacement);
  end loop;
  execute definition;
end;
$patch$;

drop policy if exists "active members can read household transactions" on public.transactions;
create policy "active members can read household transactions" on public.transactions
for select to authenticated using (public.hfos_can_read_transaction(id));

drop policy if exists "active members can read household expense allocations" on public.expense_allocations;
create policy "active members can read household expense allocations" on public.expense_allocations
for select to authenticated using (
  public.is_active_household_member(household_id)
  and exists (select 1 from public.transactions t
    where t.id = expense_allocations.transaction_id
      and t.household_id = expense_allocations.household_id
      and public.hfos_can_read_transaction(t.id))
);

drop policy if exists "active members can read household utility provider bills" on public.utility_provider_bills;
create policy "active members can read household utility provider bills" on public.utility_provider_bills
for select to authenticated using (public.hfos_can_read_provider_bill(id));

notify pgrst, 'reload schema';
commit;
