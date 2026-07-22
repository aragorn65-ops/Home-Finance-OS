import assert from "node:assert/strict";
import test from "node:test";

test(
  "Supabase auth adapter stays disabled without spike credentials",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );

    const adapter =
      new SupabaseAuthBackendAdapter();

    assert.deepEqual(
      await adapter.getSession(),
      {
        status: "disabled",
      }
    );

    const validation =
      await adapter.validateMigrationDraft(
        "draft-1"
      );

    assert.equal(
      validation.isValid,
      false
    );
    assert.match(
      validation.blockers[0],
      /VITE_SUPABASE_URL/
    );
  }
);

test(
  "Supabase auth adapter blocks live actions until the spike is wired",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
      });

    assert.deepEqual(
      await adapter.getSession(),
      {
        status: "signed-out",
      }
    );

    await assert.rejects(
      () => adapter.signIn(),
      /disposable-project spike/
    );
  }
);
