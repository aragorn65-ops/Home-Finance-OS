-- Targeted authorization repair only. No financial rows are modified.
-- Applies to the audited RPCs; aborts if their expected guard anchors differ.
begin;
do $patch$
declare
  function_name text;
  function_oid oid;
  definition text;
  anchor text;
  inserted_guard text;
  signature_count integer;
begin
  foreach function_name in array array['create_household_settlement', 'update_household_settlement']
  loop
    select count(*), min(p.oid::bigint)::oid into signature_count, function_oid
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = function_name and p.prokind = 'f';
    if signature_count <> 1 then
      raise exception 'Expected one audited signature for %, found %; nothing applied.', function_name, signature_count;
    end if;
    -- SQL Editor uploads may preserve Windows CRLF line endings in prosrc.
    definition := replace(pg_get_functiondef(function_oid), E'\r\n', E'\n');
    if function_name = 'create_household_settlement' then
      anchor := E'  if current_member_id is null then\n    raise exception ''Active household membership is required to create a settlement.'';\n  end if;\n\n';
      inserted_guard := $guard$  if not exists (
    select 1 from public.household_memberships membership
    where membership.household_id = target_household_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'admin', 'member')
  ) then
    raise exception 'Active owner, admin, or member access is required to create a settlement.';
  end if;

$guard$;
    else
      anchor := E'  if existing_settlement.id is null then\n    raise exception ''Settlement was not found.'';\n  end if;\n\n';
      inserted_guard := $guard$  if not exists (
    select 1 from public.household_memberships membership
    where membership.household_id = existing_settlement.household_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and (
        membership.role in ('owner', 'admin')
        or (
          membership.role = 'member'
          and membership.member_id in (existing_settlement.from_member_id, existing_settlement.to_member_id)
        )
      )
  ) then
    raise exception 'Active admin or original settlement participant access is required to update a settlement.';
  end if;

$guard$;
    end if;
    inserted_guard := replace(inserted_guard, E'\r\n', E'\n');
    if strpos(definition, inserted_guard) > 0 then
      continue;
    end if;
    if strpos(definition, anchor) = 0 or
       (length(definition) - length(replace(definition, anchor, ''))) <> length(anchor) then
      raise exception 'Unexpected definition for %; nothing applied.', function_name;
    end if;
    execute replace(definition, anchor, anchor || inserted_guard);
  end loop;
end;
$patch$;
notify pgrst, 'reload schema';
commit;
