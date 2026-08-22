import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import {
  join,
} from "node:path";
import test from "node:test";

test("Supabase household preference RPC references the active membership helper", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /create or replace function public\.load_household_preferences[\s\S]+public\.is_active_household_member\(target_household_id\)/
  );
  assert.doesNotMatch(
    schemaSql,
    /public\.is_household_member\(target_household_id\)/
  );
});

test("Supabase household preference save RPC avoids duplicate argument and return names", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /create or replace function public\.save_household_preferences\(\s*target_household_id uuid,\s*input_household_name text,\s*input_household_country text,\s*input_household_currency text,\s*input_household_timezone text/
  );
  assert.doesNotMatch(
    schemaSql,
    /create or replace function public\.save_household_preferences\(\s*target_household_id uuid,\s*household_name text/
  );
});

test("Supabase core snapshot save RPC avoids ambiguous household return name", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );
  const functionStart =
    schemaSql.indexOf(
      "create or replace function public.save_household_core_snapshot"
    );
  const dropStart =
    schemaSql.indexOf(
      "drop function if exists public.save_household_core_snapshot"
    );
  const functionEnd =
    schemaSql.indexOf(
      "revoke all on function public.save_household_core_snapshot",
      functionStart
    );
  const functionSql =
    schemaSql.slice(
      functionStart,
      functionEnd
    );

  assert.notEqual(
    dropStart,
    -1
  );
  assert.ok(
    dropStart < functionStart
  );
  assert.match(
    functionSql,
    /create or replace function public\.save_household_core_snapshot\([\s\S]+returns table \(\s*saved_household_id uuid,/
  );
  assert.match(
    functionSql,
    /snapshot\.household_id as saved_household_id/
  );
  assert.doesNotMatch(
    functionSql,
    /returns table \(\s*household_id uuid,/
  );
});

test("Supabase core snapshot save RPC persists expense allocations", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /create or replace function public\.save_household_core_snapshot\(\s*target_household_id uuid,\s*core_accounts jsonb,\s*core_transactions jsonb,\s*core_expense_allocations jsonb,\s*core_provider_bills jsonb/
  );
  assert.match(
    schemaSql,
    /insert into public\.expense_allocations \([\s\S]+local_record_id[\s\S]+transaction_id[\s\S]+paid_by_member_id[\s\S]+member_id/
  );
  assert.match(
    schemaSql,
    /'expense_allocations'|expense_allocations jsonb/
  );
});

test("Supabase core snapshot save RPC clears settlement applications before deleted allocations", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );
  const functionStart =
    schemaSql.indexOf(
      "create or replace function public.save_household_core_snapshot"
    );
  const functionEnd =
    schemaSql.indexOf(
      "revoke all on function public.save_household_core_snapshot",
      functionStart
    );
  const functionSql =
    schemaSql.slice(
      functionStart,
      functionEnd
    );
  const applicationDeleteIndex =
    functionSql.indexOf(
      "delete from public.settlement_applications"
    );
  const allocationDeleteIndex =
    functionSql.indexOf(
      "delete from public.expense_allocations"
    );

  assert.ok(
    applicationDeleteIndex > -1
  );
  assert.ok(
    allocationDeleteIndex > -1
  );
  assert.ok(
    applicationDeleteIndex <
      allocationDeleteIndex
  );
  assert.match(
    functionSql,
    /remote_application\.expense_allocation_id = remote_allocation\.id/
  );
});

test("Supabase core snapshot save RPC persists utility provider bills", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /provider_bills jsonb/
  );
  assert.match(
    schemaSql,
    /insert into public\.utility_provider_bills \([\s\S]+local_record_id[\s\S]+utility_type[\s\S]+bill_attachments[\s\S]+payment_attachments/
  );
  assert.match(
    schemaSql,
    /from jsonb_to_recordset\(coalesce\(core_provider_bills, '\[\]'::jsonb\)\)/
  );
  assert.match(
    schemaSql,
    /'provider_bills',|snapshot\.provider_bills/
  );
});

test("Supabase core snapshot RPC preserves transaction member ids", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /"createdByMemberId" text,\s*"paidByMemberId" text/
  );
  assert.match(
    schemaSql,
    /left join public\.household_members created_by_member[\s\S]+created_by_member\.local_record_id = nullif\(transaction_record\."createdByMemberId", ''\)/
  );
  assert.match(
    schemaSql,
    /coalesce\(paid_by_member\.id, created_by_member\.id, current_member_id\)/
  );
  assert.match(
    schemaSql,
    /'createdByMemberId', coalesce\(created_by_member\.local_record_id, created_by_member\.id::text\)/
  );
  assert.match(
    schemaSql,
    /'paidByMemberId', coalesce\(paid_by_member\.local_record_id, paid_by_member\.id::text\)/
  );
});

test("Supabase core snapshot RPC preserves account owner member ids", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /"ownerMemberId" text,\s*visibility text/
  );
  assert.match(
    schemaSql,
    /left join public\.household_members owner_member[\s\S]+owner_member\.local_record_id = nullif\(account_record\."ownerMemberId", ''\)/
  );
  assert.match(
    schemaSql,
    /coalesce\(owner_member\.id, current_member_id\)/
  );
  assert.match(
    schemaSql,
    /'ownerMemberId', coalesce\(owner_member\.local_record_id, owner_member\.id::text\)/
  );
});

test("Supabase core snapshot load RPC drops old return type before recreate", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );
  const dropStart =
    schemaSql.indexOf(
      "drop function if exists public.load_household_core_snapshot(uuid)"
    );
  const functionStart =
    schemaSql.indexOf(
      "create or replace function public.load_household_core_snapshot"
    );

  assert.notEqual(
    dropStart,
    -1
  );
  assert.ok(
    dropStart < functionStart
  );
});

test("Supabase core snapshot load RPC allows active member reads", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );
  const functionStart =
    schemaSql.indexOf(
      "create or replace function public.load_household_core_snapshot"
    );
  const grantStart =
    schemaSql.indexOf(
      "revoke all on function public.load_household_core_snapshot(uuid)"
    );
  const functionSql =
    schemaSql.slice(
      functionStart,
      grantStart
    );

  assert.match(
    functionSql,
    /current_member_id uuid;/
  );
  assert.match(
    functionSql,
    /current_member_id := public\.current_household_member_id\(target_household_id\);/
  );
  assert.match(
    functionSql,
    /Active household membership is required to load core finance records\./
  );
  assert.doesNotMatch(
    functionSql,
    /Only a household admin can load core finance records\./
  );
});

test("Supabase member invite RPC links local members to auth users", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /drop function if exists public\.invite_household_member\(\s*uuid,\s*text,\s*text,\s*text,\s*text\s*\);[\s\S]+create or replace function public\.invite_household_member/
  );
  assert.match(
    schemaSql,
    /create or replace function public\.invite_household_member\(\s*target_household_id uuid,\s*local_member_id text,\s*member_display_name text,\s*member_role text,\s*invite_email text/
  );
  assert.match(
    schemaSql,
    /returns setof public\.household_memberships/
  );
  assert.match(
    schemaSql,
    /if not public\.is_household_admin\(target_household_id\) then/
  );
  assert.match(
    schemaSql,
    /from auth\.users invited_user/
  );
  assert.match(
    schemaSql,
    /on conflict \(household_id, local_record_id\)[\s\S]+linked_user_id = excluded\.linked_user_id/
  );
  assert.match(
    schemaSql,
    /grant execute on function public\.invite_household_member\(\s*uuid,\s*text,\s*text,\s*text,\s*text\s*\) to authenticated;/
  );
});

test("Supabase household claim RPC accepts owner display name", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /drop function if exists public\.claim_household_from_backup\(\s*text,\s*text,\s*text,\s*text,\s*jsonb\s*\);/
  );
  assert.match(
    schemaSql,
    /create or replace function public\.claim_household_from_backup\([\s\S]+owner_display_name text default null/
  );
  assert.match(
    schemaSql,
    /coalesce\(nullif\(trim\(owner_display_name\), ''\), 'Household owner'\)/
  );
});

test("Supabase member profile RPC updates synced profile fields", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /create or replace function public\.update_household_member_profile\(\s*target_household_id uuid,\s*local_member_id text,\s*member_display_name text/
  );
  assert.match(
    schemaSql,
    /alter table public\.household_members\s+add column if not exists color text;/
  );
  assert.match(
    schemaSql,
    /member_color text default null/
  );
  assert.match(
    schemaSql,
    /current_member_id uuid := public\.current_household_member_id\(target_household_id\);/
  );
  assert.match(
    schemaSql,
    /if current_member_id is null then/
  );
  assert.match(
    schemaSql,
    /if not is_admin and target_member_id <> current_member_id then/
  );
  assert.match(
    schemaSql,
    /display_name = normalized_display_name/
  );
  assert.match(
    schemaSql,
    /color = coalesce\(normalized_color, member\.color\)/
  );
  assert.match(
    schemaSql,
    /when is_admin then coalesce\(normalized_status, member\.status\)/
  );
  assert.match(
    schemaSql,
    /when is_admin then coalesce\(normalized_role, member\.role\)/
  );
  assert.match(
    schemaSql,
    /raise exception 'Members can update only their own household member profile\.';/
  );
  assert.match(
    schemaSql,
    /grant execute on function public\.update_household_member_profile\(\s*uuid,\s*text,\s*text,\s*text,\s*text,\s*text\s*\) to authenticated;/
  );
});

test("Supabase settlement RPCs persist settlement attachments", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /create or replace function public\.create_household_settlement\([\s\S]+settlement_attachments jsonb[\s\S]+coalesce\(settlement_attachments, '\[\]'::jsonb\)/
  );
  assert.match(
    schemaSql,
    /create or replace function public\.update_household_settlement\([\s\S]+settlement_attachments jsonb[\s\S]+attachments = coalesce\(update_household_settlement\.settlement_attachments, '\[\]'::jsonb\)/
  );
  assert.doesNotMatch(
    schemaSql,
    /settlement_notes,\s*'\[\]'::jsonb,/
  );
});

test("Supabase settlement RPCs resolve local household member ids", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /alter table public\.household_members\s+add column if not exists local_record_id text;/
  );
  assert.match(
    schemaSql,
    /create unique index if not exists household_members_household_local_record_id_key/
  );
  assert.match(
    schemaSql,
    /create or replace function public\.create_household_settlement\(\s*target_household_id uuid,\s*local_record_id text,\s*from_member_id text,\s*to_member_id text/
  );
  assert.match(
    schemaSql,
    /member\.local_record_id = nullif\(from_member_id, ''\)/
  );
  assert.match(
    schemaSql,
    /insert into public\.household_members \([\s\S]+local_record_id[\s\S]+returning id into resolved_to_member_id;/
  );
});

test("Supabase settlement update lets involved members revise records", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /current_household_member_id\(existing_settlement\.household_id\) not in \([\s\S]+resolved_from_member_id,[\s\S]+resolved_to_member_id/
  );
  assert.match(
    schemaSql,
    /Members can update only settlement records where they are the payer or receiver\./
  );
  assert.doesNotMatch(
    schemaSql,
    /Only a household admin can update settlement records\./
  );
});

test("Supabase settlement applications resolve local allocation ids", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /allocation\.local_record_id = nullif\(application_row ->> 'expense_allocation_id', ''\)/
  );
  assert.doesNotMatch(
    schemaSql,
    /application_allocation_id := \(application_row ->> 'expense_allocation_id'\)::uuid;/
  );
});
