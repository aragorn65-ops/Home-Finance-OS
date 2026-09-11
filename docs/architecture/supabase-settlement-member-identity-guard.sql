-- Prevent settlement saves from creating placeholder member identities.
-- Does not modify existing records, permissions, allocations, or amounts.
-- Apply after reviewing the household-member audit; unresolved references now fail explicitly.
begin;

create or replace function public.create_household_settlement(
  target_household_id uuid,
  local_record_id text,
  from_member_id text,
  to_member_id text,
  settlement_amount numeric,
  settlement_date date,
  source_account_id text,
  destination_account_id text,
  application_method text,
  reference_number text,
  settlement_notes text,
  settlement_attachments jsonb,
  is_active boolean,
  settlement_applications jsonb
)
returns setof public.settlements
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_member_id uuid;
  resolved_from_member_id uuid;
  resolved_to_member_id uuid;
  resolved_source_account_id uuid;
  resolved_destination_account_id uuid;
  created_settlement public.settlements%rowtype;
  application_row jsonb;
  application_allocation_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before creating a settlement.';
  end if;

  current_member_id := public.current_household_member_id(target_household_id);

  if current_member_id is null then
    raise exception 'Active household membership is required to create a settlement.';
  end if;

  if application_method not in ('oldest-first', 'manual') then
    raise exception 'Invalid settlement application method.';
  end if;

  select member.id
  into resolved_from_member_id
  from public.household_members member
  where member.household_id = target_household_id
    and (
      member.id::text = nullif(from_member_id, '')
      or member.local_record_id = nullif(from_member_id, '')
    )
  limit 1;

  if resolved_from_member_id is null then
    raise exception 'Settlement member could not be resolved. Refresh household members before saving; no member was created.';
  end if;

  select member.id
  into resolved_to_member_id
  from public.household_members member
  where member.household_id = target_household_id
    and (
      member.id::text = nullif(to_member_id, '')
      or member.local_record_id = nullif(to_member_id, '')
    )
  limit 1;

  if resolved_to_member_id is null then
    raise exception 'Settlement member could not be resolved. Refresh household members before saving; no member was created.';
  end if;

  select account.id
  into resolved_source_account_id
  from public.accounts account
  where account.household_id = target_household_id
    and (
      account.id::text = nullif(source_account_id, '')
      or account.local_record_id = nullif(source_account_id, '')
    )
  limit 1;

  select account.id
  into resolved_destination_account_id
  from public.accounts account
  where account.household_id = target_household_id
    and (
      account.id::text = nullif(destination_account_id, '')
      or account.local_record_id = nullif(destination_account_id, '')
    )
  limit 1;

  if not public.is_household_admin(target_household_id)
    and current_member_id not in (resolved_from_member_id, resolved_to_member_id) then
    raise exception 'Members can create only settlement records where they are the payer or receiver.';
  end if;

  insert into public.settlements (
    household_id,
    local_record_id,
    from_member_id,
    to_member_id,
    amount,
    settlement_date,
    source_account_id,
    destination_account_id,
    application_method,
    reference_number,
    notes,
    attachments,
    is_active,
    updated_by_user_id
  )
  values (
    target_household_id,
    coalesce(local_record_id, gen_random_uuid()::text),
    resolved_from_member_id,
    resolved_to_member_id,
    settlement_amount,
    settlement_date,
    resolved_source_account_id,
    resolved_destination_account_id,
    application_method,
    reference_number,
    settlement_notes,
    coalesce(settlement_attachments, '[]'::jsonb),
    is_active,
    current_user_id
  )
  returning * into created_settlement;

  for application_row in
    select value
    from jsonb_array_elements(coalesce(settlement_applications, '[]'::jsonb))
  loop
    select allocation.id
    into application_allocation_id
    from public.expense_allocations allocation
    where allocation.household_id = target_household_id
      and (
        allocation.id::text = nullif(application_row ->> 'expense_allocation_id', '')
        or allocation.local_record_id = nullif(application_row ->> 'expense_allocation_id', '')
      )
    limit 1;

    if application_allocation_id is null then
      raise exception 'Settlement application allocation does not belong to this household.';
    end if;

    insert into public.settlement_applications (
      household_id,
      local_record_id,
      settlement_id,
      expense_allocation_id,
      applied_amount,
      updated_by_user_id
    )
    values (
      target_household_id,
      coalesce(application_row ->> 'local_record_id', gen_random_uuid()::text),
      created_settlement.id,
      application_allocation_id,
      (application_row ->> 'applied_amount')::numeric,
      current_user_id
    );
  end loop;

  return next created_settlement;
end;
$$;

create or replace function public.update_household_settlement(
  target_settlement_id uuid,
  local_record_id text,
  from_member_id text,
  to_member_id text,
  settlement_amount numeric,
  settlement_date date,
  source_account_id text,
  destination_account_id text,
  application_method text,
  reference_number text,
  settlement_notes text,
  settlement_attachments jsonb,
  is_active boolean,
  settlement_applications jsonb
)
returns setof public.settlements
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_settlement public.settlements%rowtype;
  resolved_from_member_id uuid;
  resolved_to_member_id uuid;
  resolved_source_account_id uuid;
  resolved_destination_account_id uuid;
  updated_settlement public.settlements%rowtype;
  application_row jsonb;
  application_allocation_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before updating a settlement.';
  end if;

  select *
  into existing_settlement
  from public.settlements
  where id = target_settlement_id
  for update;

  if existing_settlement.id is null then
    raise exception 'Settlement was not found.';
  end if;

  if application_method not in ('oldest-first', 'manual') then
    raise exception 'Invalid settlement application method.';
  end if;

  select member.id
  into resolved_from_member_id
  from public.household_members member
  where member.household_id = existing_settlement.household_id
    and (
      member.id::text = nullif(from_member_id, '')
      or member.local_record_id = nullif(from_member_id, '')
    )
  limit 1;

  if resolved_from_member_id is null then
    raise exception 'Settlement member could not be resolved. Refresh household members before saving; no member was created.';
  end if;

  select member.id
  into resolved_to_member_id
  from public.household_members member
  where member.household_id = existing_settlement.household_id
    and (
      member.id::text = nullif(to_member_id, '')
      or member.local_record_id = nullif(to_member_id, '')
    )
  limit 1;

  if resolved_to_member_id is null then
    raise exception 'Settlement member could not be resolved. Refresh household members before saving; no member was created.';
  end if;

  if not public.is_household_admin(existing_settlement.household_id)
    and public.current_household_member_id(existing_settlement.household_id) not in (
      resolved_from_member_id,
      resolved_to_member_id
    ) then
    raise exception 'Members can update only settlement records where they are the payer or receiver.';
  end if;

  select account.id
  into resolved_source_account_id
  from public.accounts account
  where account.household_id = existing_settlement.household_id
    and (
      account.id::text = nullif(source_account_id, '')
      or account.local_record_id = nullif(source_account_id, '')
    )
  limit 1;

  select account.id
  into resolved_destination_account_id
  from public.accounts account
  where account.household_id = existing_settlement.household_id
    and (
      account.id::text = nullif(destination_account_id, '')
      or account.local_record_id = nullif(destination_account_id, '')
    )
  limit 1;

  update public.settlements
  set
    local_record_id = coalesce(update_household_settlement.local_record_id, existing_settlement.local_record_id),
    from_member_id = resolved_from_member_id,
    to_member_id = resolved_to_member_id,
    amount = settlement_amount,
    settlement_date = update_household_settlement.settlement_date,
    source_account_id = resolved_source_account_id,
    destination_account_id = resolved_destination_account_id,
    application_method = update_household_settlement.application_method,
    reference_number = update_household_settlement.reference_number,
    notes = update_household_settlement.settlement_notes,
    attachments = coalesce(update_household_settlement.settlement_attachments, '[]'::jsonb),
    is_active = update_household_settlement.is_active,
    updated_at = now(),
    updated_by_user_id = current_user_id
  where id = target_settlement_id
  returning * into updated_settlement;

  delete from public.settlement_applications
  where settlement_id = target_settlement_id
    and household_id = existing_settlement.household_id;

  for application_row in
    select value
    from jsonb_array_elements(coalesce(settlement_applications, '[]'::jsonb))
  loop
    select allocation.id
    into application_allocation_id
    from public.expense_allocations allocation
    where allocation.household_id = existing_settlement.household_id
      and (
        allocation.id::text = nullif(application_row ->> 'expense_allocation_id', '')
        or allocation.local_record_id = nullif(application_row ->> 'expense_allocation_id', '')
      )
    limit 1;

    if application_allocation_id is null then
      raise exception 'Settlement application allocation does not belong to this household.';
    end if;

    insert into public.settlement_applications (
      household_id,
      local_record_id,
      settlement_id,
      expense_allocation_id,
      applied_amount,
      updated_by_user_id
    )
    values (
      existing_settlement.household_id,
      coalesce(application_row ->> 'local_record_id', gen_random_uuid()::text),
      updated_settlement.id,
      application_allocation_id,
      (application_row ->> 'applied_amount')::numeric,
      current_user_id
    );
  end loop;

  return next updated_settlement;
end;
$$;

notify pgrst, 'reload schema';
commit;
