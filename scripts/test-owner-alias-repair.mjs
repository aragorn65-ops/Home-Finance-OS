// Usage: node scripts/test-owner-alias-repair.mjs /path/to/@electric-sql/pglite/dist/index.js
// PGlite is an external test-only dependency; no production database is accessed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const directory = new URL("../docs/architecture/", import.meta.url);
const schema = readFileSync(new URL("supabase-spike-schema.sql", directory), "utf8");
const tables = schema.slice(schema.indexOf("create table if not exists public.households"),
  schema.indexOf("create table if not exists public.migration_drafts"));
const repair = readFileSync(new URL("supabase-repair-audited-owner-alias.sql", directory), "utf8");
const guard = readFileSync(new URL("supabase-settlement-member-identity-guard.sql", directory), "utf8");
const household = "bafb3901-1666-4d6f-9471-153efbcf7cff";
const owner = "9f174eb3-59c4-4505-9183-fa8d4eae07b3";
const user = "4b83b5cb-9e1a-484b-9996-0bd6166cec87";
const placeholder = "03672181-51fd-40b4-8aaf-2203d3b97523";
const payer = "1531bfe7-87c7-48a9-809e-c65dc3574583";

async function fixture() {
  const db = new PGlite();
  await db.exec("create schema auth; create table auth.users (id uuid primary key);");
  await db.exec(tables);
  await db.exec(`
    insert into auth.users values ('${user}');
    insert into public.households (id,name,country,currency,timezone)
      values ('${household}','Test','PH','PHP','Asia/Manila');
    insert into public.household_members (id,household_id,local_record_id,display_name,role,linked_user_id) values
      ('${owner}','${household}',null,'Dadi Buboy','owner','${user}'),
      ('${payer}','${household}','lyn-local','Lyn','member',null),
      ('${placeholder}','${household}','member-001','member-001','member',null);
    insert into public.household_memberships (household_id,member_id,user_id,role)
      values ('${household}','${owner}','${user}','owner');
    insert into public.settlements
      (household_id,local_record_id,from_member_id,to_member_id,amount,settlement_date,application_method)
      values ('${household}','settlement-1','${payer}','${placeholder}',1299.32,'2026-07-14','oldest-first');
    create function auth.uid() returns uuid language sql as $$ select '${user}'::uuid $$;
    create function public.is_household_admin(uuid) returns boolean language sql as $$ select true $$;
    create function public.current_household_member_id(uuid) returns uuid language sql as $$ select '${owner}'::uuid $$;
  `);
  await db.exec(`
    insert into public.transactions
      (household_id,local_record_id,paid_by_member_id,type,amount,category,transaction_date)
      values ('${household}','transaction-1','${owner}','expense',1299.32,'Internet','2026-07-04');
    insert into public.expense_allocations
      (household_id,local_record_id,transaction_id,paid_by_member_id,member_id,allocated_amount)
      select '${household}','allocation-1',id,'${owner}','${payer}',1299.32 from public.transactions;
    insert into public.settlement_applications (household_id,local_record_id,settlement_id,expense_allocation_id,applied_amount)
      select '${household}','application-1',s.id,a.id,1299.32
      from public.settlements s cross join public.expense_allocations a;
  `);
  return db;
}

async function records(db, table) {
  return (await db.query(`select to_jsonb(t) as row from public.${table} t order by id`)).rows;
}

const db = await fixture();
try {
  const before = await records(db, "settlement_applications");
  const allocations = await records(db, "expense_allocations");
  const transactions = await records(db, "transactions");
  await db.exec(repair);
  assert.deepEqual(await records(db, "settlement_applications"), before);
  assert.deepEqual(await records(db, "expense_allocations"), allocations);
  assert.deepEqual(await records(db, "transactions"), transactions);
  const result = await db.query("select to_member_id,amount,settlement_date::text from public.settlements");
  assert.deepEqual(result.rows, [{ to_member_id: owner, amount: "1299.32", settlement_date: "2026-07-14" }]);
  assert.equal((await db.query("select count(*)::int as count from public.household_members")).rows[0].count, 2);
  await db.exec(repair);
  assert.deepEqual(await records(db, "settlement_applications"), before);
  await db.exec(guard);
  await assert.rejects(db.query(`select * from public.create_household_settlement(
    $1::uuid,'new-settlement','unrecognized','member-001',1,'2026-07-14',null,null,
    'oldest-first',null,null,'[]'::jsonb,true,'[]'::jsonb)`, [household]), /Settlement member could not be resolved/);
  assert.equal((await db.query("select count(*)::int as count from public.household_members")).rows[0].count, 2);
  console.log("PASS: repair preserves applications and amounts; rerun is safe; identity guard rejects new placeholders.");
} finally { await db.close(); }

for (const scenario of ["unexpected-reference", "changed-owner", "second-settlement"]) {
  const db = await fixture();
  try {
    if (scenario === "unexpected-reference") await db.exec(`
      create table public.unexpected_member_link (member_id uuid references public.household_members(id) on delete cascade);
      insert into public.unexpected_member_link values ('${placeholder}');
    `);
    if (scenario === "changed-owner") await db.exec(`update public.household_members set role='member' where id='${owner}';`);
    if (scenario === "second-settlement") await db.exec(`
      insert into public.settlements
        (household_id,local_record_id,from_member_id,to_member_id,amount,settlement_date,application_method)
        values ('${household}','settlement-2','${payer}','${placeholder}',10,'2026-07-15','oldest-first');
    `);
    const before = await records(db, "settlements");
    await assert.rejects(db.exec(repair));
    await db.exec("rollback;");
    assert.deepEqual(await records(db, "settlements"), before);
    assert.equal((await db.query("select count(*)::int as count from public.household_members")).rows[0].count, 3);
    console.log(`PASS: ${scenario} aborts without changing settlements or members.`);
  } finally { await db.close(); }
}
