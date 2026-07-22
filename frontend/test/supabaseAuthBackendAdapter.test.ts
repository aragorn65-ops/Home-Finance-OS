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
            async in() {
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

function createSignedInClient(
  overrides: Record<string, unknown> = {}
) {
  return createSignedOutClient({
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
    ...overrides,
  });
}

function createBackupSummary() {
  return {
    householdName:
      "Casa Test",
    exportedAt:
      "2026-07-22T01:00:00Z",
    accountCount:
      2,
    transactionCount:
      3,
    expenseAllocationCount:
      4,
    settlementCount:
      1,
    settlementApplicationCount:
      1,
    savingsGoalCount:
      1,
    savingsActivityCount:
      2,
    providerBillCount:
      1,
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

    await assert.rejects(
      () =>
        adapter.validateMigrationDraft(
          "draft-1"
        ),
      /Supabase auth spike is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY\./
    );

    await assert.rejects(
      () =>
        adapter.commitMigrationDraft(
          "draft-1"
        ),
      /Supabase auth spike is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY\./
    );

    await assert.rejects(
      () =>
        adapter.abortMigrationDraft(
          "draft-1"
        ),
      /Supabase auth spike is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY\./
    );
  }
);

test(
  "Supabase auth adapter reads active household diagnostics",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const queries: unknown[] = [];
    const rpcCalls: unknown[] = [];

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedOutClient(),
          from(tableName: string) {
            return {
              select(columns: string) {
                return {
                  async eq() {
                    return {
                      data: [],
                      error: null,
                    };
                  },
                  async in(
                    column: string,
                    values: string[]
                  ) {
                    queries.push({
                      tableName,
                      columns,
                      column,
                      values,
                    });

                    return {
                      data: [
                        {
                          id:
                            "household-1",
                          name:
                            "Casa Test",
                          status:
                            "active",
                        },
                        {
                          id:
                            "household-2",
                          name:
                            "Archived Home",
                          status:
                            "archived",
                        },
                      ],
                      error: null,
                    };
                  },
                };
              },
            };
          },
          async rpc(
            functionName: string,
            parameters: Record<string, unknown>
          ) {
            rpcCalls.push({
              functionName,
              parameters,
            });

            return {
              data: {
                draft_id:
                  "migration-1",
                status:
                  "validated",
                validated_at:
                  "2026-07-22T04:00:00Z",
              },
              error: null,
            };
          },
        },
      });

    const households =
      await adapter
        .listHouseholdDiagnostics([
          "household-1",
          "household-1",
          "household-2",
          "",
        ]);

    assert.deepEqual(
      queries,
      [
        {
          tableName:
            "households",
          columns:
            "id,name,status",
          column:
            "id",
          values: [
            "household-1",
            "household-2",
          ],
        },
      ]
    );
    assert.deepEqual(
      households,
      [
        {
          householdId:
            "household-1",
          householdName:
            "Casa Test",
          status:
            "active",
        },
      ]
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
  "Supabase auth adapter requires sign-in before household claim RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedOutClient(),
          async rpc(
            functionName: string,
            parameters: Record<string, unknown>
          ) {
            rpcCalls.push({
              functionName,
              parameters,
            });

            return {
              data: null,
              error: null,
            };
          },
        },
      });

    await assert.rejects(
      () =>
        adapter.createHouseholdClaimDraft({
          householdName:
            "Casa Test",
          ownerMemberId:
            "local-owner",
          backupSummary:
            createBackupSummary(),
        }),
      /Sign in before claiming a household\./
    );

    assert.deepEqual(
      rpcCalls,
      []
    );
  }
);

test(
  "Supabase auth adapter creates a household claim through RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedInClient(),
          async rpc(
            functionName: string,
            parameters: Record<string, unknown>
          ) {
            rpcCalls.push({
              functionName,
              parameters,
            });

            return {
              data: {
                household_id:
                  "11111111-1111-4111-8111-111111111111",
                membership_id:
                  "22222222-2222-4222-8222-222222222222",
                member_id:
                  "33333333-3333-4333-8333-333333333333",
                user_id:
                  "user-1",
                role:
                  "owner",
                membership_status:
                  "active",
                migration_draft_id:
                  "55555555-5555-4555-8555-555555555555",
                migration_status:
                  "uploaded",
                created_at:
                  "2026-07-22T02:00:00Z",
                updated_at:
                  "2026-07-22T03:00:00Z",
              },
              error: null,
            };
          },
        },
      });

    const backupSummary =
      createBackupSummary();

    const claim =
      await adapter
        .createHouseholdClaimDraft({
          householdName:
            "Casa Test",
          ownerMemberId:
            "local-owner",
          backupSummary,
        });

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "claim_household_from_backup",
          parameters: {
            draft_household_name:
              "Casa Test",
            draft_country:
              "PH",
            draft_currency:
              "PHP",
            draft_timezone:
              Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone,
            draft_backup_summary:
              backupSummary,
          },
        },
      ]
    );
    assert.equal(
      claim.householdId,
      "11111111-1111-4111-8111-111111111111"
    );
    assert.equal(
      claim.membership.memberId,
      "33333333-3333-4333-8333-333333333333"
    );
    assert.equal(
      claim.membership.role,
      "owner"
    );
    assert.equal(
      claim.migrationDraft.id,
      "55555555-5555-4555-8555-555555555555"
    );
    assert.equal(
      claim.migrationDraft.remoteRecordCount,
      16
    );
    assert.equal(
      claim.migrationDraft.updatedAt
        .toISOString(),
      "2026-07-22T03:00:00.000Z"
    );
  }
);

test(
  "Supabase auth adapter rejects household claim results for another user",
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
          ...createSignedInClient(),
          async rpc() {
            return {
              data: {
                household_id:
                  "11111111-1111-4111-8111-111111111111",
                membership_id:
                  "22222222-2222-4222-8222-222222222222",
                member_id:
                  "33333333-3333-4333-8333-333333333333",
                user_id:
                  "other-user",
                role:
                  "owner",
                membership_status:
                  "active",
                migration_draft_id:
                  "55555555-5555-4555-8555-555555555555",
                migration_status:
                  "uploaded",
                created_at:
                  "2026-07-22T02:00:00Z",
                updated_at:
                  "2026-07-22T03:00:00Z",
              },
              error: null,
            };
          },
        },
      });

    await assert.rejects(
      () =>
        adapter.createHouseholdClaimDraft({
          householdName:
            "Casa Test",
          ownerMemberId:
            "local-owner",
          backupSummary:
            createBackupSummary(),
        }),
      /Supabase household claim returned an invalid user\./
    );
  }
);

test(
  "Supabase auth adapter validates migration draft metadata for the current user",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const queries: unknown[] = [];
    const rpcCalls: unknown[] = [];

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
                  eq(
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
                      async eq(
                        nestedColumn: string,
                        nestedValue: string
                      ) {
                        queries.push({
                          tableName,
                          columns,
                          column:
                            nestedColumn,
                          value:
                            nestedValue,
                        });

                        return {
                          data: [
                            {
                              id:
                                "migration-1",
                              household_id:
                                "household-1",
                              owner_user_id:
                                "user-1",
                              owner_member_id:
                                "member-1",
                              household_name:
                                "Casa Test",
                              status:
                                "uploaded",
                              validated_at:
                                null,
                              committed_at:
                                null,
                              aborted_at:
                                null,
                              created_at:
                                "2026-07-22T02:00:00Z",
                              updated_at:
                                "2026-07-22T03:00:00Z",
                            },
                          ],
                          error: null,
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          async rpc(
            functionName: string,
            parameters: Record<string, unknown>
          ) {
            rpcCalls.push({
              functionName,
              parameters,
            });

            return {
              data: {
                draft_id:
                  "migration-1",
                status:
                  "validated",
                validated_at:
                  "2026-07-22T04:00:00Z",
              },
              error: null,
            };
          },
        },
      });

    const validation =
      await adapter
        .validateMigrationDraft(
          "migration-1"
        );

    assert.deepEqual(
      queries,
      [
        {
          tableName:
            "migration_drafts",
          columns:
            "id,household_id,owner_user_id,owner_member_id,household_name,status,validated_at,committed_at,aborted_at,created_at,updated_at",
          column:
            "id",
          value:
            "migration-1",
        },
        {
          tableName:
            "migration_drafts",
          columns:
            "id,household_id,owner_user_id,owner_member_id,household_name,status,validated_at,committed_at,aborted_at,created_at,updated_at",
          column:
            "owner_user_id",
          value:
            "user-1",
        },
      ]
    );
    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "validate_migration_draft_metadata",
          parameters: {
            target_draft_id:
              "migration-1",
          },
        },
      ]
    );
    assert.deepEqual(
      validation,
      {
        draftId:
          "migration-1",
        isValid:
          true,
        recordCountsMatch:
          true,
        warnings: [
          "Supabase migration validation is metadata-only in this spike.",
        ],
        blockers: [],
      }
    );
  }
);

test(
  "Supabase auth adapter blocks invalid migration draft metadata",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];

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
          from() {
            return {
              select() {
                return {
                  eq() {
                    return {
                      async eq() {
                        return {
                          data: [
                            {
                              id:
                                "migration-1",
                              household_id:
                                null,
                              owner_user_id:
                                "user-1",
                              owner_member_id:
                                "",
                              household_name:
                                "Casa Test",
                              status:
                                "aborted",
                              created_at:
                                "2026-07-22T02:00:00Z",
                              updated_at:
                                "2026-07-22T03:00:00Z",
                            },
                          ],
                          error: null,
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          async rpc(
            functionName: string,
            parameters: Record<string, unknown>
          ) {
            rpcCalls.push({
              functionName,
              parameters,
            });

            return {
              data: null,
              error: null,
            };
          },
        },
      });

    const validation =
      await adapter
        .validateMigrationDraft(
          "migration-1"
        );

    assert.equal(
      validation.isValid,
      false
    );
    assert.equal(
      validation.recordCountsMatch,
      false
    );
    assert.deepEqual(
      rpcCalls,
      []
    );
    assert.deepEqual(
      validation.blockers,
      [
        "Migration draft is missing a linked household.",
        "Migration draft is missing an owner member.",
        "Migration draft has already been aborted.",
      ]
    );
  }
);

test(
  "Supabase auth adapter rejects invalid migration validation RPC results",
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
          from() {
            return {
              select() {
                return {
                  eq() {
                    return {
                      async eq() {
                        return {
                          data: [
                            {
                              id:
                                "migration-1",
                              household_id:
                                "household-1",
                              owner_user_id:
                                "user-1",
                              owner_member_id:
                                "member-1",
                              household_name:
                                "Casa Test",
                              status:
                                "uploaded",
                              created_at:
                                "2026-07-22T02:00:00Z",
                              updated_at:
                                "2026-07-22T03:00:00Z",
                            },
                          ],
                          error: null,
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          async rpc() {
            return {
              data: {
                draft_id:
                  "migration-1",
                status:
                  "uploaded",
                validated_at:
                  null,
              },
              error: null,
            };
          },
        },
      });

    await assert.rejects(
      () =>
        adapter.validateMigrationDraft(
          "migration-1"
        ),
      /Supabase migration validation returned an invalid result\./
    );
  }
);

test(
  "Supabase auth adapter requires sign-in before migration write actions",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedOutClient(),
          async rpc(
            functionName: string,
            parameters: Record<string, unknown>
          ) {
            rpcCalls.push({
              functionName,
              parameters,
            });

            return {
              data: null,
              error: null,
            };
          },
        },
      });

    await assert.rejects(
      () =>
        adapter.commitMigrationDraft(
          "migration-1"
        ),
      /Sign in before committing a migration draft\./
    );

    await assert.rejects(
      () =>
        adapter.abortMigrationDraft(
          "migration-1"
        ),
      /Sign in before aborting a migration draft\./
    );

    assert.deepEqual(
      rpcCalls,
      []
    );
  }
);

test(
  "Supabase auth adapter aborts migration draft through RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedInClient(),
          async rpc(
            functionName: string,
            parameters: Record<string, unknown>
          ) {
            rpcCalls.push({
              functionName,
              parameters,
            });

            return {
              data: {
                draft_id:
                  "migration-1",
                status:
                  "aborted",
                aborted_at:
                  "2026-07-22T05:00:00Z",
              },
              error: null,
            };
          },
        },
      });

    await adapter.abortMigrationDraft(
      "migration-1"
    );

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "abort_migration_draft",
          parameters: {
            target_draft_id:
              "migration-1",
          },
        },
      ]
    );
  }
);

test(
  "Supabase auth adapter rejects invalid migration abort RPC results",
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
          ...createSignedInClient(),
          async rpc() {
            return {
              data: {
                draft_id:
                  "migration-2",
                status:
                  "aborted",
                aborted_at:
                  "2026-07-22T05:00:00Z",
              },
              error: null,
            };
          },
        },
      });

    await assert.rejects(
      () =>
        adapter.abortMigrationDraft(
          "migration-1"
        ),
      /Supabase migration abort returned an invalid result\./
    );
  }
);

test(
  "Supabase auth adapter reports migration abort failures",
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
          ...createSignedInClient(),
          async rpc() {
            return {
              data: null,
              error: {
                message:
                  "Committed migration drafts cannot be aborted.",
              },
            };
          },
        },
      });

    await assert.rejects(
      () =>
        adapter.abortMigrationDraft(
          "migration-1"
        ),
      /Supabase migration abort failed: Committed migration drafts cannot be aborted\./
    );
  }
);

test(
  "Supabase auth adapter rejects invalid migration commit RPC results",
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
          ...createSignedInClient(),
          async rpc() {
            return {
              data: {
                draft_id:
                  "migration-1",
                household_id:
                  "",
                status:
                  "validated",
                committed_at:
                  "2026-07-22T06:00:00Z",
              },
              error: null,
            };
          },
        },
      });

    await assert.rejects(
      () =>
        adapter.commitMigrationDraft(
          "migration-1"
        ),
      /Supabase migration commit returned an invalid result\./
    );
  }
);

test(
  "Supabase auth adapter commits migration draft through RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedInClient(),
          async rpc(
            functionName: string,
            parameters: Record<string, unknown>
          ) {
            rpcCalls.push({
              functionName,
              parameters,
            });

            return {
              data: {
                draft_id:
                  "migration-1",
                household_id:
                  "household-1",
                status:
                  "committed",
                committed_at:
                  "2026-07-22T06:00:00Z",
              },
              error: null,
            };
          },
        },
      });

    const result =
      await adapter.commitMigrationDraft(
        "migration-1"
      );

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "commit_migration_draft",
          parameters: {
            target_draft_id:
              "migration-1",
          },
        },
      ]
    );
    assert.deepEqual(
      result,
      {
        householdId:
          "household-1",
        migrationId:
          "migration-1",
        committedAt:
          new Date(
            "2026-07-22T06:00:00Z"
          ),
      }
    );
  }
);

test(
  "Supabase auth adapter reports migration commit failures",
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
          ...createSignedInClient(),
          async rpc() {
            return {
              data: null,
              error: {
                message:
                  "Validate the migration draft before committing it.",
              },
            };
          },
        },
      });

    await assert.rejects(
      () =>
        adapter.commitMigrationDraft(
          "migration-1"
        ),
      /Supabase migration commit failed: Validate the migration draft before committing it\./
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

test(
  "Supabase auth adapter creates aggregate account diagnostics",
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
          ...createSignedOutClient(),
          from(tableName: string) {
            return {
              select(columns: string) {
                return {
                  async eq() {
                    return {
                      data: [],
                      error: null,
                    };
                  },
                  async in(
                    column: string,
                    values: string[]
                  ) {
                    queries.push({
                      tableName,
                      columns,
                      column,
                      values,
                    });

                    return {
                      data: [
                        {
                          household_id:
                            "household-1",
                          owner_member_id:
                            "member-1",
                          account_class:
                            "asset",
                          visibility:
                            "household",
                          currency:
                            "PHP",
                          is_active:
                            true,
                        },
                        {
                          household_id:
                            "household-1",
                          owner_member_id:
                            "member-1",
                          account_class:
                            "liability",
                          visibility:
                            "private",
                          currency:
                            "USD",
                          is_active:
                            false,
                        },
                        {
                          household_id:
                            "household-2",
                          owner_member_id:
                            "member-2",
                          account_class:
                            "asset",
                          visibility:
                            "private",
                          currency:
                            "PHP",
                          is_active:
                            true,
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

    const summary =
      await adapter
        .createAccountDiagnosticSummary([
          "household-1",
          "household-2",
          "household-1",
          "",
        ]);

    assert.deepEqual(
      queries,
      [
        {
          tableName:
            "accounts",
          columns:
            "household_id,owner_member_id,account_class,visibility,currency,is_active",
          column:
            "household_id",
          values: [
            "household-1",
            "household-2",
          ],
        },
      ]
    );
    assert.deepEqual(
      summary,
      {
        totalCount:
          3,
        activeCount:
          2,
        inactiveCount:
          1,
        householdVisibleCount:
          1,
        privateVisibleCount:
          2,
        assetCount:
          2,
        liabilityCount:
          1,
        currencies: [
          "PHP",
          "USD",
        ],
      }
    );
  }
);

test(
  "Supabase auth adapter creates aggregate transaction diagnostics",
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
          ...createSignedOutClient(),
          from(tableName: string) {
            return {
              select(columns: string) {
                return {
                  async eq() {
                    return {
                      data: [],
                      error: null,
                    };
                  },
                  async in(
                    column: string,
                    values: string[]
                  ) {
                    queries.push({
                      tableName,
                      columns,
                      column,
                      values,
                    });

                    return {
                      data: [
                        {
                          household_id:
                            "household-1",
                          type:
                            "income",
                          visibility:
                            "private",
                          transaction_date:
                            "2026-07-01",
                          is_active:
                            true,
                        },
                        {
                          household_id:
                            "household-1",
                          type:
                            "expense",
                          visibility:
                            "participants",
                          transaction_date:
                            "2026-07-11",
                          is_active:
                            true,
                        },
                        {
                          household_id:
                            "household-2",
                          type:
                            "transfer",
                          visibility:
                            "household",
                          transaction_date:
                            "2026-07-20",
                          is_active:
                            false,
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

    const summary =
      await adapter
        .createTransactionDiagnosticSummary([
          "household-1",
          "household-2",
          "household-1",
          "",
        ]);

    assert.deepEqual(
      queries,
      [
        {
          tableName:
            "transactions",
          columns:
            "household_id,type,visibility,transaction_date,is_active",
          column:
            "household_id",
          values: [
            "household-1",
            "household-2",
          ],
        },
      ]
    );
    assert.deepEqual(
      summary,
      {
        totalCount:
          3,
        activeCount:
          2,
        inactiveCount:
          1,
        incomeCount:
          1,
        expenseCount:
          1,
        transferCount:
          1,
        householdVisibleCount:
          1,
        participantVisibleCount:
          1,
        privateVisibleCount:
          1,
        earliestTransactionDate:
          "2026-07-01",
        latestTransactionDate:
          "2026-07-20",
      }
    );
  }
);

test(
  "Supabase auth adapter reads migration draft diagnostics for the current user",
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
                            "migration-1",
                          household_id:
                            "household-1",
                          owner_user_id:
                            "user-1",
                          owner_member_id:
                            "member-1",
                          household_name:
                            "Casa Test",
                          status:
                            "uploaded",
                          validated_at:
                            "2026-07-22T04:00:00Z",
                          committed_at:
                            "2026-07-22T05:00:00Z",
                          aborted_at:
                            null,
                          created_at:
                            "2026-07-22T02:00:00Z",
                          updated_at:
                            "2026-07-22T03:00:00Z",
                        },
                        {
                          id:
                            "migration-invalid",
                          household_id:
                            "household-1",
                          owner_user_id:
                            "user-1",
                          owner_member_id:
                            "member-1",
                          household_name:
                            "Casa Test",
                          status:
                            "unknown",
                          validated_at:
                            null,
                          committed_at:
                            null,
                          aborted_at:
                            null,
                          created_at:
                            "2026-07-22T02:00:00Z",
                          updated_at:
                            "2026-07-22T03:00:00Z",
                        },
                      ],
                      error: null,
                    };
                  },
                  async in() {
                    return {
                      data: [],
                      error: null,
                    };
                  },
                };
              },
            };
          },
        },
      });

    const drafts =
      await adapter.listMigrationDrafts();

    assert.deepEqual(
      queries,
      [
        {
          tableName:
            "migration_drafts",
          columns:
            "id,household_id,owner_user_id,owner_member_id,household_name,status,validated_at,committed_at,aborted_at,created_at,updated_at",
          column:
            "owner_user_id",
          value:
            "user-1",
        },
      ]
    );
    assert.equal(
      drafts.length,
      1
    );
    assert.equal(
      drafts[0]?.id,
      "migration-1"
    );
    assert.equal(
      drafts[0]?.householdName,
      "Casa Test"
    );
    assert.equal(
      drafts[0]?.status,
      "uploaded"
    );
    assert.equal(
      drafts[0]?.backupSummary.accountCount,
      0
    );
    assert.equal(
      drafts[0]?.backupSummary.transactionCount,
      0
    );
    assert.equal(
      drafts[0]?.updatedAt.toISOString(),
      "2026-07-22T03:00:00.000Z"
    );
    assert.equal(
      drafts[0]?.validatedAt?.toISOString(),
      "2026-07-22T04:00:00.000Z"
    );
    assert.equal(
      drafts[0]?.committedAt?.toISOString(),
      "2026-07-22T05:00:00.000Z"
    );
    assert.equal(
      drafts[0]?.abortedAt,
      undefined
    );
  }
);

test(
  "auth diagnostics keep core Supabase status when optional reads fail",
  async () => {
    const {
      createAuthDiagnosticsForAdapter,
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/index.ts"
    );

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedOutClient({
            async getSession() {
              return {
                data: {
                  session: {
                    user: {
                      id:
                        "user-1",
                      email:
                        "test@example.com",
                      created_at:
                        "2026-07-22T00:00:00Z",
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
                  },
                },
                error: null,
              };
            },
          }),
          from(tableName: string) {
            return {
              select() {
                return {
                  async eq() {
                    if (
                      tableName ===
                      "household_memberships"
                    ) {
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
                            created_at:
                              "2026-07-22T00:00:00Z",
                            updated_at:
                              "2026-07-22T01:00:00Z",
                          },
                        ],
                        error: null,
                      };
                    }

                    return {
                      data: [],
                      error: null,
                    };
                  },
                  async in() {
                    return {
                      data: null,
                      error: {
                        message:
                          `${tableName} unavailable`,
                      },
                    };
                  },
                };
              },
            };
          },
        },
      });

    const diagnostics =
      await createAuthDiagnosticsForAdapter(
        adapter,
        {
          enabled:
            true,
          provider:
            "supabase",
        }
      );

    assert.equal(
      diagnostics.sessionStatus,
      "signed-in"
    );
    assert.equal(
      diagnostics.adapterType,
      "supabase"
    );
    assert.equal(
      diagnostics.membershipCount,
      1
    );
    assert.deepEqual(
      diagnostics.warnings,
      [
        "Household diagnostics could not be loaded: Supabase household lookup failed: households unavailable",
        "Account diagnostics could not be loaded: Supabase account diagnostics failed: accounts unavailable",
        "Transaction diagnostics could not be loaded: Supabase transaction diagnostics failed: transactions unavailable",
      ]
    );
    assert.equal(
      diagnostics.accountSummary,
      undefined
    );
    assert.equal(
      diagnostics.transactionSummary,
      undefined
    );
  }
);
