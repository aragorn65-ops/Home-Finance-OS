-- Targeted repair for the member audit supplied on 2026-09-12.
-- Close HFOS tabs during repair. Run in Supabase SQL Editor as database admin.
-- Export a backup first. This transaction aborts on unexpected references/state.
-- Then apply supabase-settlement-member-identity-guard.sql to prevent recurrence.
begin;

lock table public.household_members, public.household_memberships,
  public.settlements, public.settlement_applications in share row exclusive mode;

do $$
declare
  target_household constant uuid := 'bafb3901-1666-4d6f-9471-153efbcf7cff';
  real_owner constant uuid := '9f174eb3-59c4-4505-9183-fa8d4eae07b3';
  owner_user constant uuid := '4b83b5cb-9e1a-484b-9996-0bd6166cec87';
  placeholder constant uuid := '03672181-51fd-40b4-8aaf-2203d3b97523';
  owner_row public.household_members%rowtype;
  placeholder_row public.household_members%rowtype;
  settlements_before jsonb;
  applications_before jsonb;
  settlements_after jsonb;
  applications_after jsonb;
  reference_count bigint;
  reference_column record;
begin
  select * into owner_row from public.household_members
  where id = real_owner and household_id = target_household for update;
  if not found then
    raise exception 'Expected owner record not found; nothing was changed.';
  end if;
  if owner_row.linked_user_id is distinct from owner_user
    or owner_row.display_name <> 'Dadi Buboy'
    or owner_row.role <> 'owner' or owner_row.status <> 'active'
    or (owner_row.local_record_id is not null and owner_row.local_record_id <> 'member-001')
    or not exists (
      select 1 from public.household_memberships
      where household_id = target_household and member_id = real_owner
        and user_id = owner_user and role = 'owner' and status = 'active'
    ) then
    raise exception 'Owner identity or access differs from the audit; nothing was changed.';
  end if;

  select * into placeholder_row from public.household_members
  where id = placeholder for update;
  if not found then
    if owner_row.local_record_id = 'member-001' then
      raise notice 'Owner alias repair is already applied.';
      return;
    end if;
    raise exception 'Placeholder is missing but owner alias is not repaired; inspect before proceeding.';
  end if;
  if placeholder_row.household_id <> target_household
    or placeholder_row.local_record_id is distinct from 'member-001'
    or placeholder_row.display_name <> 'member-001'
    or placeholder_row.linked_user_id is not null
    or placeholder_row.role <> 'member' or placeholder_row.status <> 'active'
    or exists (select 1 from public.household_memberships where member_id = placeholder) then
    raise exception 'Placeholder identity differs from the audit; nothing was changed.';
  end if;

  select count(*) into reference_count from public.settlements
  where from_member_id = placeholder or to_member_id = placeholder;
  if reference_count <> 1 then
    raise exception 'Expected exactly one placeholder settlement; found %. Nothing was changed.', reference_count;
  end if;
  if exists (
    select 1 from public.settlements
    where (from_member_id = placeholder or to_member_id = placeholder)
      and (household_id <> target_household
        or from_member_id = real_owner or to_member_id = real_owner
        or from_member_id = to_member_id)
  ) then
    raise exception 'Settlement would cross households or become a self-payment; nothing was changed.';
  end if;

  select coalesce(jsonb_agg(to_jsonb(s) - 'from_member_id' - 'to_member_id' - 'updated_at' order by s.id), '[]'::jsonb)
    into settlements_before from public.settlements s where household_id = target_household;
  select coalesce(jsonb_agg(to_jsonb(a) order by a.id), '[]'::jsonb)
    into applications_before from public.settlement_applications a where household_id = target_household;

  update public.settlements
  set from_member_id = case when from_member_id = placeholder then real_owner else from_member_id end,
      to_member_id = case when to_member_id = placeholder then real_owner else to_member_id end,
      updated_at = now()
  where household_id = target_household
    and (from_member_id = placeholder or to_member_id = placeholder);

  -- Check every installed FK, including tables not present in the local schema.
  -- Never rely on ON DELETE CASCADE to clean up financial or access records.
  for reference_column in
    select ns.nspname as schema_name, tab.relname as table_name,
      att.attname as column_name, cardinality(c.conkey) as key_columns
    from pg_constraint c
    join pg_class tab on tab.oid = c.conrelid
    join pg_namespace ns on ns.oid = tab.relnamespace
    join pg_attribute att on att.attrelid = c.conrelid and att.attnum = c.conkey[1]
    where c.contype = 'f' and c.confrelid = 'public.household_members'::regclass
  loop
    if reference_column.key_columns <> 1 then
      raise exception 'Unexpected composite member FK; inspect before repairing.';
    end if;
    execute format('select count(*) from %I.%I where %I = $1',
      reference_column.schema_name, reference_column.table_name, reference_column.column_name)
      into reference_count using placeholder;
    if reference_count <> 0 then
      raise exception 'Unexpected placeholder references in %.% (% rows); entire repair rolled back.',
        reference_column.table_name, reference_column.column_name, reference_count;
    end if;
  end loop;

  delete from public.household_members where id = placeholder and household_id = target_household;
  update public.household_members set local_record_id = 'member-001', updated_at = now()
  where id = real_owner and household_id = target_household;

  select coalesce(jsonb_agg(to_jsonb(s) - 'from_member_id' - 'to_member_id' - 'updated_at' order by s.id), '[]'::jsonb)
    into settlements_after from public.settlements s where household_id = target_household;
  select coalesce(jsonb_agg(to_jsonb(a) order by a.id), '[]'::jsonb)
    into applications_after from public.settlement_applications a where household_id = target_household;
  if settlements_before is distinct from settlements_after
    or applications_before is distinct from applications_after then
    raise exception 'Settlement content or applications changed unexpectedly; entire repair rolled back.';
  end if;
  raise notice 'Owner alias repaired. One settlement redirected; payment amounts, dates and applications preserved.';
end;
$$;

commit;

select m.id as remote_member_id, m.local_record_id, m.display_name,
  m.role as profile_role, hm.role as access_role, hm.status as access_status,
  (select count(*) from public.settlements s where s.household_id = m.household_id
    and (s.from_member_id = m.id or s.to_member_id = m.id)) as settlements
from public.household_members m
left join public.household_memberships hm on hm.household_id = m.household_id and hm.member_id = m.id
where m.household_id = 'bafb3901-1666-4d6f-9471-153efbcf7cff'::uuid
order by m.created_at, m.id;
