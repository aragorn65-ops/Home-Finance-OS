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
    assert.equal(
      adapter.isConfigured(),
      false
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
  "Supabase auth adapter reads a configured client session",
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
        client: {
          auth: {
            async getSession() {
              return {
                data: {
                  session: {
                    expires_at:
                      1767225600,
                    user: {
                      id:
                        "user-1",
                      email:
                        "test@example.com",
                      created_at:
                        "2026-07-22T00:00:00Z",
                      updated_at:
                        "2026-07-22T01:00:00Z",
                      user_metadata: {
                        display_name:
                          "Test User",
                      },
                    },
                  },
                },
                error: null,
              };
            },
            async getUser() {
              return {
                data: {
                  user: {
                    id:
                      "user-1",
                    email:
                      "test@example.com",
                    created_at:
                      "2026-07-22T00:00:00Z",
                    updated_at:
                      "2026-07-22T01:00:00Z",
                    user_metadata: {
                      display_name:
                        "Test User",
                    },
                  },
                },
                error: null,
              };
            },
            async signInWithOtp() {
              return {
                error: null,
              };
            },
            async signOut() {
              return {
                error: null,
              };
            },
          },
        },
      });

    assert.equal(
      adapter.isConfigured(),
      true
    );

    const session =
      await adapter.getSession();

    assert.equal(
      session.status,
      "signed-in"
    );
    assert.equal(
      session.user?.email,
      "test@example.com"
    );
    assert.equal(
      session.user?.displayName,
      "Test User"
    );

    await assert.rejects(
      () => adapter.signIn(),
      /requires an email/
    );
  }
);

test(
  "Supabase auth adapter sends a disposable magic-link request",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const requests: unknown[] = [];

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          auth: {
            async getSession() {
              return {
                data: {
                  session: null,
                },
                error: null,
              };
            },
            async getUser() {
              return {
                data: {
                  user: null,
                },
                error: null,
              };
            },
            async signInWithOtp(
              request: unknown
            ) {
              requests.push(request);
              return {
                error: null,
              };
            },
            async signOut() {
              return {
                error: null,
              };
            },
          },
        },
      });

    const session =
      await adapter.signIn({
        email:
          " tester@example.com ",
        redirectTo:
          "https://home-finance-os.pages.dev/app/settings",
      });

    assert.equal(
      session.status,
      "signed-out"
    );
    assert.deepEqual(
      requests,
      [
        {
          email:
            "tester@example.com",
          options: {
            emailRedirectTo:
              "https://home-finance-os.pages.dev/app/settings",
            shouldCreateUser:
              false,
          },
        },
      ]
    );
  }
);
