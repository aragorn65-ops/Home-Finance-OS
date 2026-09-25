// Usage: node scripts/test-member-read-privacy.mjs /path/to/pglite/dist/index.js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const dir = new URL("../docs/architecture/", import.meta.url);
const schema = readFileSync(new URL("supabase-spike-schema.sql", dir), "utf8");
const patch = readFileSync(new URL("supabase-member-read-privacy-fix.sql", dir), "utf8");
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const db = new PGlite();
try {
  await db.exec(`create schema auth; create table auth.users (id uuid primary key); create role authenticated;
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.user',true),'')::uuid $$;`);
  await db.exec(schema.slice(schema.indexOf("create table if not exists public.households"), schema.indexOf("create table if not exists public.migration_drafts")));
  await db.exec(schema.slice(schema.indexOf("create or replace function public.is_active_household_member"), schema.indexOf('drop policy if exists "active members can read households"')));
  const start = schema.indexOf("create or replace function public.load_household_core_snapshot(");
  const end = schema.indexOf("grant execute on function public.load_household_core_snapshot(uuid)", start);
  await db.exec(schema.slice(start, schema.indexOf(";", end) + 1));
  await db.exec(`insert into households (id,name,country,currency,timezone) values
    ('${id(1)}','One','PH','PHP','Asia/Manila'),('${id(2)}','Two','PH','PHP','Asia/Manila');`);
  for (const [n, role, status, house] of [[10,'owner','active',1],[11,'admin','active',1],
    [12,'member','active',1],[13,'viewer','active',1],[14,'member','inactive',1],[15,'member','active',2]]) {
    await db.exec(`insert into auth.users values ('${id(n)}');
      insert into household_members (id,household_id,local_record_id,display_name,role,linked_user_id)
      values ('${id(n)}','${id(house)}','member-${n}','Fixture','${role}','${id(n)}');
      insert into household_memberships (household_id,member_id,user_id,role,status)
      values ('${id(house)}','${id(n)}','${id(n)}','${role}','${status}');`);
  }
  for (const [n, visibility, owner, house] of [[100,'household',10,1],[101,'private',10,1],
    [102,'private',12,1],[103,'participants',10,1],[104,'participants',10,1],[105,'household',15,2]]) {
    await db.exec(`insert into transactions (id,household_id,local_record_id,created_by_member_id,paid_by_member_id,type,amount,category,transaction_date,visibility)
      values ('${id(n)}','${id(house)}','tx-${n}','${id(owner)}','${id(owner)}','expense',100,'Internet','2026-09-01','${visibility}');
      insert into expense_allocations (id,household_id,local_record_id,transaction_id,paid_by_member_id,member_id,allocated_amount)
      values ('${id(n+100)}','${id(house)}','share-${n}','${id(n)}','${id(owner)}','${id(n === 103 ? 12 : owner)}',100);
      insert into utility_provider_bills (id,household_id,local_record_id,utility_type,unit,provider_name,billing_date,due_date,visibility,paid_by_member_id,member_share_snapshot)
      values ('${id(n+200)}','${id(house)}','bill-${n}','internet','PHP','Fixture','2026-09-01','2026-09-20','${visibility}','${id(owner)}',
      '[{"memberId":"member-${n === 103 ? 12 : owner}"}]');`);
  }
  for (const [n, visibility, owner] of [[400,'household',10],[401,'private',10],[402,'private',12]]) {
    await db.exec(`insert into accounts (id,household_id,local_record_id,owner_member_id,visibility,name,account_class,account_type,currency)
      values ('${id(n)}','${id(1)}','account-${n}','${id(owner)}','${visibility}','Fixture','asset','cash','PHP');`);
  }
  const login = (n) => db.query("select set_config('test.user',$1,false)", [n ? id(n) : '']);
  const snapshot = async () => (await db.query(`select * from load_household_core_snapshot('${id(1)}')`)).rows[0];
  const financialRows = async () => (await db.query("select jsonb_agg(to_jsonb(t) order by id) as rows from transactions t")).rows;
  await login(10);
  const adminBefore = await snapshot();
  const rowsBefore = await financialRows();
  await db.exec(patch);
  await db.exec(patch);
  const comparable = ({saved_at, ...rest}) => rest;
  assert.deepEqual(comparable(await snapshot()), comparable(adminBefore));
  assert.deepEqual(await financialRows(), rowsBefore);
  await db.exec(`alter table transactions enable row level security;
    alter table expense_allocations enable row level security;
    alter table utility_provider_bills enable row level security;
    grant select on transactions,expense_allocations,utility_provider_bills to authenticated;
    grant usage on schema auth to authenticated;`);
  for (const [user, expected] of [[10,[100,101,102,103,104]],[11,[100,101,102,103,104]],
    [12,[100,102,103]],[13,[100]]]) {
    await login(user);
    await db.exec('set role authenticated');
    const result = await snapshot();
    assert.deepEqual(result.transactions.map((t) => t.id).sort(), expected.map((n) => `tx-${n}`).sort());
    assert.deepEqual(result.provider_bills.map((b) => b.id).sort(), expected.map((n) => `bill-${n}`).sort());
    assert.equal(result.expense_allocations.length, expected.length);
    assert.deepEqual(result.accounts.map((a) => a.id).sort(),
      (user === 12 ? ['account-400','account-402'] : user === 13 ? ['account-400'] : ['account-400','account-401','account-402']));
    for (const table of ['transactions','expense_allocations','utility_provider_bills']) {
      assert.equal((await db.query(`select * from ${table}`)).rows.length, expected.length);
    }
    await db.exec('reset role');
  }
  for (const user of [null,14,15]) {
    await login(user);
    await db.exec('set role authenticated');
    await assert.rejects(snapshot());
    assert.equal((await db.query(`select * from transactions where household_id = '${id(1)}'`)).rows.length, 0);
    await db.exec('reset role');
  }
  console.log('PASS: snapshot and direct RLS reads; owner/admin baseline unchanged; member/viewer privacy; inactive/outsider/signed-out; idempotent migration; finance rows unchanged');
} finally { await db.close(); }
