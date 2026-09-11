-- READ ONLY: identify canonical memberships and referenced placeholder profiles.
-- Return these results before merging or deleting identities. No finance rows change.
select
  m.household_id, m.id as remote_member_id, m.local_record_id,
  m.display_name, m.role as profile_role, m.status as profile_status,
  m.linked_user_id, hm.user_id as membership_user_id,
  hm.role as access_role, hm.status as access_status,
  (select count(*) from public.transactions t where t.household_id = m.household_id
    and (t.paid_by_member_id = m.id or t.created_by_member_id = m.id)) as transactions,
  (select count(*) from public.expense_allocations a where a.household_id = m.household_id
    and (a.paid_by_member_id = m.id or a.member_id = m.id)) as expense_allocations,
  (select count(*) from public.settlements s where s.household_id = m.household_id
    and (s.from_member_id = m.id or s.to_member_id = m.id)) as settlements
from public.household_members m
left join public.household_memberships hm
  on hm.household_id = m.household_id and hm.member_id = m.id
where m.household_id = 'bafb3901-1666-4d6f-9471-153efbcf7cff'::uuid
order by m.created_at, m.id;
