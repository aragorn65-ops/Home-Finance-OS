// Disposable PostgreSQL/WASM tests. No production connection.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const dir = new URL("../docs/architecture/", import.meta.url);
const schema = readFileSync(new URL("supabase-spike-schema.sql", dir), "utf8");
const patch = readFileSync(new URL("supabase-settlement-write-access-fix.sql", dir), "utf8");
const guards = [...patch.matchAll(/\$guard\$([\s\S]*?)\$guard\$/g)].map((match) => match[1]);
let rpc = readFileSync(new URL("supabase-settlement-member-identity-guard.sql", dir), "utf8");
for (const guard of guards) { assert.ok(rpc.includes(guard)); rpc = rpc.replace(guard, ""); }
const db = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
try {
  await db.exec(`create schema auth; create table auth.users (id uuid primary key);
    create role authenticated;
    create function auth.uid() returns uuid language sql as
    $$ select nullif(current_setting('test.user', true), '')::uuid $$;`);
  await db.exec(schema.slice(schema.indexOf("create table if not exists public.households"),
    schema.indexOf("create table if not exists public.migration_drafts")));
  const helpers = schema.slice(schema.indexOf("create or replace function public.is_active_household_member"),
    schema.indexOf('drop policy if exists "active members can read households"'));
  await db.exec(helpers);
  await db.exec(rpc);
  await db.exec(`insert into households (id,name,country,currency,timezone) values
    ('${id(1)}','Household','PH','PHP','Asia/Manila'), ('${id(2)}','Other','PH','PHP','Asia/Manila');`);
  for (const [n, role, status, house] of [[10,"owner","active",1], [11,"admin","active",1],
    [12,"member","active",1], [13,"viewer","active",1], [14,"member","inactive",1],
    [15,"member","active",2], [16,"member","active",1]]) {
    await db.exec(`insert into auth.users values ('${id(n)}');
      insert into household_members (id,household_id,display_name,role,linked_user_id)
      values ('${id(n)}','${id(house)}','Fixture','${role}','${id(n)}');
      insert into household_memberships (household_id,member_id,user_id,role,status)
      values ('${id(house)}','${id(n)}','${id(n)}','${role}','${status}');`);
  }
  await db.exec(`insert into settlements
    (id,household_id,local_record_id,from_member_id,to_member_id,amount,settlement_date,application_method)
    values ('${id(100)}','${id(1)}','original','${id(12)}','${id(10)}',50,'2026-07-01','manual');`);
  const records = async () => (await db.query("select to_jsonb(s) as row from settlements s order by id")).rows;
  const before = await records();
  await db.exec(patch);
  assert.deepEqual(await records(), before);
  await db.exec(patch);
  assert.deepEqual(await records(), before);
  const login = (n) => db.query("select set_config('test.user', $1, false)", [n ? id(n) : ""]);
  const create = (payer) => db.query(`select * from create_household_settlement(
    '${id(1)}',gen_random_uuid()::text,'${id(payer)}','${id(10)}',10,'2026-07-01',null,null,'manual',null,'', '[]',true,'[]')`);
  const update = (payer = 12) => db.query(`select * from update_household_settlement(
    '${id(100)}',null,'${id(payer)}','${id(10)}',50,'2026-07-02',null,null,'manual',null,'', '[]',true,'[]')`);
  for (const n of [null,13,14,15]) {
    await login(n);
    const original = await records();
    await assert.rejects(create(n === 13 ? 13 : 12));
    await assert.rejects(update(n === 13 ? 13 : 12));
    assert.deepEqual(await records(), original);
  }
  await login(16);
  await assert.rejects(update(16)); // Cannot adopt somebody else's settlement.
  await assert.rejects(create(12)); // Cannot create an uninvolved settlement.
  for (const n of [10,11,12]) {
    await login(n);
    assert.equal((await create(12)).rows.length, 1);
    assert.equal((await update()).rows.length, 1);
  }
  // Unknown schema shape must abort instead of applying a partial migration.
  await db.exec("alter function create_household_settlement(uuid,text,text,text,numeric,date,text,text,text,text,text,jsonb,boolean,jsonb) rename to unexpected_create");
  await assert.rejects(db.exec(patch), /Expected one audited signature/);
  await db.exec("rollback");
  console.log("PASS: signed-out, viewer, inactive, other household, uninvolved, participant, admin, owner; idempotency and unchanged migration data");
} finally { await db.close(); }
