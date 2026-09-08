-- Update only the existing snapshot-save function to preserve settlement links.
-- No data is changed by installing this function.

create or replace function public.save_household_core_snapshot(
  target_household_id uuid,
  core_accounts jsonb,
  core_transactions jsonb,
  core_expense_allocations jsonb,
  core_provider_bills jsonb
)
returns table (
  saved_household_id uuid,
  accounts jsonb,
  transactions jsonb,
  expense_allocations jsonb,
  provider_bills jsonb,
  saved_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_member_id uuid;
  snapshot_timestamp timestamptz := now();
  fallback_cash_account_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before saving core finance records.';
  end if;

  if not public.is_household_admin(target_household_id) then
    raise exception 'Only a household admin can save core finance records.';
  end if;

  current_member_id := public.current_household_member_id(target_household_id);

  if current_member_id is null then
    raise exception 'Active household membership is required to save core finance records.';
  end if;

  if jsonb_typeof(coalesce(core_accounts, '[]'::jsonb)) <> 'array' then
    raise exception 'Core account snapshot must be an array.';
  end if;

  if jsonb_typeof(coalesce(core_transactions, '[]'::jsonb)) <> 'array' then
    raise exception 'Core transaction snapshot must be an array.';
  end if;

  if jsonb_typeof(coalesce(core_expense_allocations, '[]'::jsonb)) <> 'array' then
    raise exception 'Core expense allocation snapshot must be an array.';
  end if;

  if jsonb_typeof(coalesce(core_provider_bills, '[]'::jsonb)) <> 'array' then
    raise exception 'Core provider bill snapshot must be an array.';
  end if;

  -- A stale or edited expense snapshot must not erase payment history.
  -- Explicit clearing deletes settlements first, so it has no application links here.
  if exists (
    select 1
    from public.settlement_applications payment_link
    join public.expense_allocations allocation
      on allocation.id = payment_link.expense_allocation_id
      and allocation.household_id = target_household_id
    where payment_link.household_id = target_household_id
      and allocation.local_record_id is not null
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(core_expense_allocations, '[]'::jsonb)) incoming
        where incoming ->> 'id' = allocation.local_record_id
      )
  ) then
    raise exception 'Snapshot was not saved because it would remove expense shares with recorded settlements. Reload cloud data before editing. Settlement history was preserved.';
  end if;

  with provider_bill_payload as (
    select provider_bill_record.id
    from jsonb_to_recordset(coalesce(core_provider_bills, '[]'::jsonb)) as provider_bill_record(
      id text
    )
  )
  delete from public.utility_provider_bills remote_provider_bill
  where remote_provider_bill.household_id = target_household_id
    and remote_provider_bill.local_record_id is not null
    and not exists (
      select 1
      from provider_bill_payload
      where provider_bill_payload.id = remote_provider_bill.local_record_id
    );

  with allocation_payload as (
    select allocation_record.id
    from jsonb_to_recordset(coalesce(core_expense_allocations, '[]'::jsonb)) as allocation_record(
      id text
    )
  )
  delete from public.settlement_applications remote_application
  using public.expense_allocations remote_allocation
  where remote_application.household_id = target_household_id
    and remote_application.expense_allocation_id = remote_allocation.id
    and remote_allocation.household_id = target_household_id
    and remote_allocation.local_record_id is not null
    and not exists (
      select 1
      from allocation_payload
      where allocation_payload.id = remote_allocation.local_record_id
    );

  with allocation_payload as (
    select allocation_record.id
    from jsonb_to_recordset(coalesce(core_expense_allocations, '[]'::jsonb)) as allocation_record(
      id text
    )
  )
  delete from public.expense_allocations remote_allocation
  where remote_allocation.household_id = target_household_id
    and remote_allocation.local_record_id is not null
    and not exists (
      select 1
      from allocation_payload
      where allocation_payload.id = remote_allocation.local_record_id
    );

  with transaction_payload as (
    select transaction_record.id
    from jsonb_to_recordset(coalesce(core_transactions, '[]'::jsonb)) as transaction_record(
      id text
    )
  )
  update public.utility_provider_bills remote_provider_bill
  set
    status = 'unpaid',
    paid_by_member_id = null,
    source_account_id = null,
    paid_at = null,
    payment_reference_number = null,
    payment_attachments = '[]'::jsonb,
    transaction_id = null,
    updated_at = snapshot_timestamp,
    updated_by_user_id = current_user_id
  from public.transactions remote_transaction
  where remote_provider_bill.household_id = target_household_id
    and remote_provider_bill.transaction_id = remote_transaction.id
    and remote_transaction.household_id = target_household_id
    and remote_transaction.local_record_id is not null
    and not exists (
      select 1
      from transaction_payload
      where transaction_payload.id = remote_transaction.local_record_id
    );

  with transaction_payload as (
    select transaction_record.id
    from jsonb_to_recordset(coalesce(core_transactions, '[]'::jsonb)) as transaction_record(
      id text
    )
  )
  delete from public.transactions remote_transaction
  where remote_transaction.household_id = target_household_id
    and remote_transaction.local_record_id is not null
    and not exists (
      select 1
      from transaction_payload
      where transaction_payload.id = remote_transaction.local_record_id
    );

  with account_payload as (
    select account_record.id
    from jsonb_to_recordset(coalesce(core_accounts, '[]'::jsonb)) as account_record(
      id text
    )
  )
  delete from public.accounts remote_account
  where remote_account.household_id = target_household_id
    and remote_account.local_record_id is not null
    and not exists (
      select 1
      from account_payload
      where account_payload.id = remote_account.local_record_id
    );

  insert into public.accounts (
    household_id,
    local_record_id,
    owner_member_id,
    name,
    institution,
    account_class,
    account_type,
    visibility,
    currency,
    base_currency,
    exchange_rate,
    exchange_rate_effective_date,
    exchange_rate_source,
    exchange_rate_provider,
    opening_balance,
    current_balance,
    opening_base_balance,
    current_base_balance,
    account_number,
    credit_limit,
    statement_balance,
    minimum_payment,
    payment_due_date,
    is_active,
    created_at,
    updated_at,
    updated_by_user_id
  )
  select
    target_household_id,
    account_record.id,
    coalesce(owner_member.id, current_member_id),
    account_record.name,
    nullif(account_record.institution, ''),
    account_record."accountClass",
    account_record.type,
    coalesce(account_record.visibility, 'household'),
    account_record.currency,
    nullif(account_record."baseCurrency", ''),
    account_record."exchangeRate",
    nullif(account_record."exchangeRateEffectiveDate", '')::date,
    account_record."exchangeRateSource",
    nullif(account_record."exchangeRateProvider", ''),
    account_record."openingBalance",
    account_record."currentBalance",
    account_record."openingBaseBalance",
    account_record."currentBaseBalance",
    nullif(account_record."accountNumber", ''),
    account_record."creditLimit",
    account_record."statementBalance",
    account_record."minimumPayment",
    nullif(account_record."paymentDueDate", '')::date,
    account_record."isActive",
    coalesce(nullif(account_record."createdAt", '')::timestamptz, snapshot_timestamp),
    snapshot_timestamp,
    current_user_id
  from jsonb_to_recordset(coalesce(core_accounts, '[]'::jsonb)) as account_record(
    id text,
    "ownerMemberId" text,
    visibility text,
    name text,
    institution text,
    "accountClass" text,
    type text,
    currency text,
    "baseCurrency" text,
    "exchangeRate" numeric,
    "exchangeRateEffectiveDate" text,
    "exchangeRateSource" text,
    "exchangeRateProvider" text,
    "openingBalance" numeric,
    "currentBalance" numeric,
    "openingBaseBalance" numeric,
    "currentBaseBalance" numeric,
    "accountNumber" text,
    "creditLimit" numeric,
    "statementBalance" numeric,
    "minimumPayment" numeric,
    "paymentDueDate" text,
    "isActive" boolean,
    "createdAt" text,
    "updatedAt" text
  )
  left join public.household_members owner_member
    on owner_member.household_id = target_household_id
   and (
        owner_member.id::text = nullif(account_record."ownerMemberId", '')
        or owner_member.local_record_id = nullif(account_record."ownerMemberId", '')
   )
  on conflict (household_id, local_record_id)
  where local_record_id is not null
  do update set
    owner_member_id = excluded.owner_member_id,
    name = excluded.name,
    institution = excluded.institution,
    account_class = excluded.account_class,
    account_type = excluded.account_type,
    visibility = excluded.visibility,
    currency = excluded.currency,
    base_currency = excluded.base_currency,
    exchange_rate = excluded.exchange_rate,
    exchange_rate_effective_date = excluded.exchange_rate_effective_date,
    exchange_rate_source = excluded.exchange_rate_source,
    exchange_rate_provider = excluded.exchange_rate_provider,
    opening_balance = excluded.opening_balance,
    current_balance = excluded.current_balance,
    opening_base_balance = excluded.opening_base_balance,
    current_base_balance = excluded.current_base_balance,
    account_number = excluded.account_number,
    credit_limit = excluded.credit_limit,
    statement_balance = excluded.statement_balance,
    minimum_payment = excluded.minimum_payment,
    payment_due_date = excluded.payment_due_date,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at,
    updated_by_user_id = excluded.updated_by_user_id;

  insert into public.transactions (
    household_id,
    local_record_id,
    created_by_member_id,
    paid_by_member_id,
    expense_split_method,
    source_account_id,
    destination_account_id,
    type,
    amount,
    entered_amount,
    entered_currency,
    base_currency,
    base_amount,
    exchange_rate,
    exchange_rate_effective_date,
    exchange_rate_source,
    exchange_rate_provider,
    category,
    description,
    notes,
    attachments,
    visibility,
    transaction_date,
    is_active,
    created_at,
    updated_at,
    updated_by_user_id
  )
  select
    target_household_id,
    transaction_record.id,
    coalesce(created_by_member.id, current_member_id),
    coalesce(paid_by_member.id, created_by_member.id, current_member_id),
    nullif(transaction_record."expenseSplitMethod", ''),
    case
      when lower(trim(transaction_record.type)) = 'expense' then
        coalesce(source_account.id, cash_account.id)
      else source_account.id
    end,
    destination_account.id,
    transaction_record.type,
    transaction_record.amount,
    transaction_record."enteredAmount",
    nullif(transaction_record."enteredCurrency", ''),
    nullif(transaction_record."baseCurrency", ''),
    transaction_record."baseAmount",
    transaction_record."exchangeRate",
    nullif(transaction_record."exchangeRateEffectiveDate", '')::date,
    transaction_record."exchangeRateSource",
    nullif(transaction_record."exchangeRateProvider", ''),
    transaction_record.category,
    coalesce(transaction_record.description, ''),
    coalesce(transaction_record.notes, ''),
    coalesce(transaction_record.attachments, '[]'::jsonb),
    coalesce(transaction_record.visibility, 'household'),
    transaction_record."transactionDate"::date,
    transaction_record."isActive",
    coalesce(nullif(transaction_record."createdAt", '')::timestamptz, snapshot_timestamp),
    snapshot_timestamp,
    current_user_id
  from jsonb_to_recordset(coalesce(core_transactions, '[]'::jsonb)) as transaction_record(
    id text,
    "createdByMemberId" text,
    "paidByMemberId" text,
    "expenseSplitMethod" text,
    visibility text,
    type text,
    amount numeric,
    "enteredAmount" numeric,
    "enteredCurrency" text,
    "baseCurrency" text,
    "baseAmount" numeric,
    "exchangeRate" numeric,
    "exchangeRateEffectiveDate" text,
    "exchangeRateSource" text,
    "exchangeRateProvider" text,
    "sourceAccountId" text,
    "destinationAccountId" text,
    category text,
    description text,
    notes text,
    attachments jsonb,
    "transactionDate" text,
    "isActive" boolean,
    "createdAt" text,
    "updatedAt" text
  )
  left join public.household_members created_by_member
    on created_by_member.household_id = target_household_id
   and (
        created_by_member.id::text = nullif(transaction_record."createdByMemberId", '')
        or created_by_member.local_record_id = nullif(transaction_record."createdByMemberId", '')
   )
  left join public.household_members paid_by_member
    on paid_by_member.household_id = target_household_id
   and (
        paid_by_member.id::text = nullif(transaction_record."paidByMemberId", '')
        or paid_by_member.local_record_id = nullif(transaction_record."paidByMemberId", '')
   )
  left join public.accounts source_account
    on source_account.household_id = target_household_id
   and source_account.local_record_id = transaction_record."sourceAccountId"
  left join lateral (
    select fallback_account.id
    from public.accounts fallback_account
    where fallback_account.household_id = target_household_id
      and fallback_account.account_type = 'cash'
      and fallback_account.account_class = 'asset'
      and fallback_account.is_active = true
    order by
      case
        when lower(fallback_account.name) = 'cash' then 0
        else 1
      end,
      fallback_account.created_at,
      fallback_account.id
    limit 1
  ) cash_account on true
  left join public.accounts destination_account
    on destination_account.household_id = target_household_id
   and destination_account.local_record_id = transaction_record."destinationAccountId"
  on conflict (household_id, local_record_id)
  where local_record_id is not null
  do update set
    created_by_member_id = excluded.created_by_member_id,
    paid_by_member_id = excluded.paid_by_member_id,
    expense_split_method = excluded.expense_split_method,
    source_account_id = excluded.source_account_id,
    destination_account_id = excluded.destination_account_id,
    type = excluded.type,
    amount = excluded.amount,
    entered_amount = excluded.entered_amount,
    entered_currency = excluded.entered_currency,
    base_currency = excluded.base_currency,
    base_amount = excluded.base_amount,
    exchange_rate = excluded.exchange_rate,
    exchange_rate_effective_date = excluded.exchange_rate_effective_date,
    exchange_rate_source = excluded.exchange_rate_source,
    exchange_rate_provider = excluded.exchange_rate_provider,
    category = excluded.category,
    description = excluded.description,
    notes = excluded.notes,
    attachments = excluded.attachments,
    visibility = excluded.visibility,
    transaction_date = excluded.transaction_date,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at,
    updated_by_user_id = excluded.updated_by_user_id;

  select fallback_account.id
  into fallback_cash_account_id
  from public.accounts fallback_account
  where fallback_account.household_id = target_household_id
    and fallback_account.account_type = 'cash'
    and fallback_account.account_class = 'asset'
    and fallback_account.is_active = true
  order by
    case
      when lower(fallback_account.name) = 'cash' then 0
      else 1
    end,
    fallback_account.created_at,
    fallback_account.id
  limit 1;

  if fallback_cash_account_id is not null then
    update public.transactions remote_transaction
    set
      source_account_id = fallback_cash_account_id,
      paid_by_member_id = coalesce(remote_transaction.paid_by_member_id, current_member_id),
      updated_at = snapshot_timestamp,
      updated_by_user_id = current_user_id
    where remote_transaction.household_id = target_household_id
      and remote_transaction.local_record_id is not null
      and lower(trim(remote_transaction.type)) = 'expense'
      and remote_transaction.source_account_id is null;
  end if;

  insert into public.expense_allocations (
    household_id,
    local_record_id,
    transaction_id,
    paid_by_member_id,
    member_id,
    is_included,
    allocated_amount,
    personal_amount,
    personal_items,
    notes,
    created_at,
    updated_at,
    updated_by_user_id
  )
  select
    target_household_id,
    allocation_record.id,
    remote_transaction.id,
    coalesce(paid_by_member.id, current_member_id),
    coalesce(allocation_member.id, current_member_id),
    allocation_record."isIncluded",
    allocation_record."allocatedAmount",
    allocation_record."personalAmount",
    coalesce(allocation_record."personalItems", '[]'::jsonb),
    nullif(allocation_record.notes, ''),
    coalesce(nullif(allocation_record."createdAt", '')::timestamptz, snapshot_timestamp),
    snapshot_timestamp,
    current_user_id
  from jsonb_to_recordset(coalesce(core_expense_allocations, '[]'::jsonb)) as allocation_record(
    id text,
    "transactionId" text,
    "paidByMemberId" text,
    "memberId" text,
    "isIncluded" boolean,
    "allocatedAmount" numeric,
    "personalAmount" numeric,
    "personalItems" jsonb,
    notes text,
    "createdAt" text,
    "updatedAt" text
  )
  join public.transactions remote_transaction
    on remote_transaction.household_id = target_household_id
   and remote_transaction.local_record_id = allocation_record."transactionId"
  left join public.household_members paid_by_member
    on paid_by_member.household_id = target_household_id
   and (
        paid_by_member.id::text = nullif(allocation_record."paidByMemberId", '')
        or paid_by_member.local_record_id = nullif(allocation_record."paidByMemberId", '')
   )
  left join public.household_members allocation_member
    on allocation_member.household_id = target_household_id
   and (
        allocation_member.id::text = nullif(allocation_record."memberId", '')
        or allocation_member.local_record_id = nullif(allocation_record."memberId", '')
   )
  on conflict (household_id, local_record_id)
  where local_record_id is not null
  do update set
    transaction_id = excluded.transaction_id,
    paid_by_member_id = excluded.paid_by_member_id,
    member_id = excluded.member_id,
    is_included = excluded.is_included,
    allocated_amount = excluded.allocated_amount,
    personal_amount = excluded.personal_amount,
    personal_items = excluded.personal_items,
    notes = excluded.notes,
    updated_at = excluded.updated_at,
    updated_by_user_id = excluded.updated_by_user_id;

  insert into public.utility_provider_bills (
    household_id,
    local_record_id,
    utility_type,
    unit,
    provider_name,
    billing_date,
    due_date,
    total_bill_amount,
    rate_per_unit,
    status,
    form_snapshot,
    calculation_snapshot,
    member_share_snapshot,
    bill_attachments,
    payment_attachments,
    paid_by_member_id,
    source_account_id,
    paid_at,
    payment_reference_number,
    transaction_id,
    visibility,
    description,
    notes,
    is_active,
    created_at,
    updated_at,
    updated_by_user_id
  )
  select
    target_household_id,
    provider_bill_record.id,
    provider_bill_record."utilityType",
    provider_bill_record.unit,
    coalesce(provider_bill_record."providerName", ''),
    provider_bill_record."billingDate"::date,
    provider_bill_record."dueDate"::date,
    provider_bill_record."totalBillAmount",
    provider_bill_record."ratePerUnit",
    coalesce(provider_bill_record.status, 'unpaid'),
    coalesce(provider_bill_record."formSnapshot", '{}'::jsonb),
    coalesce(provider_bill_record."calculationSnapshot", '{}'::jsonb),
    coalesce(provider_bill_record."memberShareSnapshot", '[]'::jsonb),
    coalesce(provider_bill_record."billAttachments", '[]'::jsonb),
    coalesce(provider_bill_record."paymentAttachments", '[]'::jsonb),
    case
      when nullif(provider_bill_record."paidByMemberId", '') is null then null
      else coalesce(paid_by_member.id, current_member_id)
    end,
    source_account.id,
    nullif(provider_bill_record."paidAt", '')::timestamptz,
    nullif(provider_bill_record."paymentReferenceNumber", ''),
    linked_transaction.id,
    coalesce(provider_bill_record.visibility, 'household'),
    coalesce(provider_bill_record.description, ''),
    coalesce(provider_bill_record.notes, ''),
    provider_bill_record."isActive",
    coalesce(nullif(provider_bill_record."createdAt", '')::timestamptz, snapshot_timestamp),
    snapshot_timestamp,
    current_user_id
  from jsonb_to_recordset(coalesce(core_provider_bills, '[]'::jsonb)) as provider_bill_record(
    id text,
    "utilityType" text,
    unit text,
    "providerName" text,
    "billingDate" text,
    "dueDate" text,
    "totalBillAmount" numeric,
    "ratePerUnit" numeric,
    status text,
    "formSnapshot" jsonb,
    "calculationSnapshot" jsonb,
    "memberShareSnapshot" jsonb,
    "billAttachments" jsonb,
    "paymentAttachments" jsonb,
    "paidByMemberId" text,
    "sourceAccountId" text,
    "paidAt" text,
    "paymentReferenceNumber" text,
    "transactionId" text,
    visibility text,
    description text,
    notes text,
    "isActive" boolean,
    "createdAt" text,
    "updatedAt" text
  )
  left join public.household_members paid_by_member
    on paid_by_member.household_id = target_household_id
   and (
        paid_by_member.id::text = nullif(provider_bill_record."paidByMemberId", '')
        or paid_by_member.local_record_id = nullif(provider_bill_record."paidByMemberId", '')
   )
  left join public.accounts source_account
    on source_account.household_id = target_household_id
   and source_account.local_record_id = nullif(provider_bill_record."sourceAccountId", '')
  left join public.transactions linked_transaction
    on linked_transaction.household_id = target_household_id
   and linked_transaction.local_record_id = nullif(provider_bill_record."transactionId", '')
  on conflict (household_id, local_record_id)
  where local_record_id is not null
  do update set
    utility_type = excluded.utility_type,
    unit = excluded.unit,
    provider_name = excluded.provider_name,
    billing_date = excluded.billing_date,
    due_date = excluded.due_date,
    total_bill_amount = excluded.total_bill_amount,
    rate_per_unit = excluded.rate_per_unit,
    status = excluded.status,
    form_snapshot = excluded.form_snapshot,
    calculation_snapshot = excluded.calculation_snapshot,
    member_share_snapshot = excluded.member_share_snapshot,
    bill_attachments = excluded.bill_attachments,
    payment_attachments = excluded.payment_attachments,
    paid_by_member_id = excluded.paid_by_member_id,
    source_account_id = excluded.source_account_id,
    paid_at = excluded.paid_at,
    payment_reference_number = excluded.payment_reference_number,
    transaction_id = excluded.transaction_id,
    visibility = excluded.visibility,
    description = excluded.description,
    notes = excluded.notes,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at,
    updated_by_user_id = excluded.updated_by_user_id;

  return query
  select
    snapshot.household_id as saved_household_id,
    snapshot.accounts,
    snapshot.transactions,
    snapshot.expense_allocations,
    snapshot.provider_bills,
    snapshot.saved_at
  from public.load_household_core_snapshot(target_household_id) as snapshot;
end;
$$;

notify pgrst, 'reload schema';

