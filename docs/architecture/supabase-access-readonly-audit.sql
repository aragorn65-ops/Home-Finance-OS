-- Read-only metadata audit. No financial records or authentication secrets.
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  pg_get_userbyid(p.proowner) as function_owner,
  p.proconfig as function_settings,
  pg_get_functiondef(p.oid) as installed_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'load_household_core_snapshot',
    'create_household_settlement',
    'update_household_settlement',
    'current_household_member_id',
    'is_household_admin'
  )
order by p.proname, p.oid;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('accounts', 'transactions', 'expense_allocations',
    'utility_provider_bills', 'settlements', 'settlement_applications')
order by tablename, policyname;

select c.relname as table_name,
  pg_get_userbyid(c.relowner) as table_owner,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('accounts', 'transactions', 'expense_allocations',
    'utility_provider_bills', 'settlements', 'settlement_applications')
order by c.relname;
