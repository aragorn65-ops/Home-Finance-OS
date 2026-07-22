import assert from "node:assert/strict";
import test from "node:test";

function createSignedOutClient(
  overrides: Record<string, unknown> = {}
) {
  return {
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
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {
                return undefined;
              },
            },
          },
        };
      },
      ...overrides,
    },
    from() {
      return {
        select() {
          return {
            async eq() {
              return {
                data: [],
                error: null,
              };
            },
          };
        },
      };
    },
  };
}

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
        client:
          createSignedOutClient({
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
          }),
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
        client:
          createSignedOutClient({
            async signInWithOtp(
              request: unknown
            ) {
              requests.push(request);
              return {
                error: null,
              };
            },
          }),
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

test(
  "Supabase auth adapter subscribes to auth callback changes",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    let callback:
      | (() => void)
      | undefined;
    let unsubscribeCount = 0;
    let changeCount = 0;

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client:
          createSignedOutClient({
            onAuthStateChange(
              onChange: () => void
            ) {
              callback = onChange;

              return {
                data: {
                  subscription: {
                    unsubscribe() {
                      unsubscribeCount += 1;
                    },
                  },
                },
              };
            },
          }),
      });

    const subscription =
      adapter.subscribeToSessionChanges(
        () => {
          changeCount += 1;
        }
      );

    await Promise.resolve();
    callback?.();
    assert.equal(
      changeCount,
      1
    );

    subscription.unsubscribe();
    await Promise.resolve();
    callback?.();

    assert.equal(
      unsubscribeCount,
      1
    );
    assert.equal(
      changeCount,
      1
    );
  }
);

test(
  "Supabase auth adapter reads memberships for the current user",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const queries: unknown[] = [];

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedOutClient({
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
                  },
                },
                error: null,
              };
            },
          }),
          from(tableName: string) {
            return {
              select(columns: string) {
                return {
                  async eq(
                    column: string,
                    value: string
                  ) {
                    queries.push({
                      tableName,
                      columns,
                      column,
                      value,
                    });

                    return {
                      data: [
                        {
                          id:
                            "membership-1",
                          household_id:
                            "household-1",
                          user_id:
                            "user-1",
                          member_id:
                            "member-1",
                          role:
                            "owner",
                          status:
                            "active",
                          invited_by_user_id:
                            null,
                          invited_at:
                            null,
                          accepted_at:
                            "2026-07-22T02:00:00Z",
                          removed_at:
                            null,
                          created_at:
                            "2026-07-22T00:00:00Z",
                          updated_at:
                            "2026-07-22T01:00:00Z",
                        },
                        {
                          id:
                            "membership-invalid",
                          household_id:
                            "household-2",
                          user_id:
                            "user-1",
                          member_id:
                            "member-2",
                          role:
                            "unknown",
                          status:
                            "active",
                          created_at:
                            "2026-07-22T00:00:00Z",
                        },
                      ],
                      error: null,
                    };
                  },
                };
              },
            };
          },
        },
      });

    const memberships =
      await adapter.listMemberships();

    assert.equal(
      memberships.length,
      1
    );
    assert.deepEqual(
      queries,
      [
        {
          tableName:
            "household_memberships",
          columns:
            "id,household_id,user_id,member_id,role,status,invited_by_user_id,invited_at,accepted_at,removed_at,created_at,updated_at",
          column:
            "user_id",
          value:
            "user-1",
        },
      ]
    );
    assert.equal(
      memberships[0]?.householdId,
      "household-1"
    );
    assert.equal(
      memberships[0]?.memberId,
      "member-1"
    );
    assert.equal(
      memberships[0]?.role,
      "owner"
    );
    assert.equal(
      memberships[0]?.acceptedAt
        ?.toISOString(),
      "2026-07-22T02:00:00.000Z"
    );
  }
);
