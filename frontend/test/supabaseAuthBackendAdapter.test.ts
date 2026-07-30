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
        adapter.stageMigrationUploadManifest(
          "draft-1",
          {
            expectedRecordCount:
              1,
            counts: [],
          }
        ),
      /Supabase auth spike is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY\./
    );

    await assert.rejects(
      () =>
        adapter.stageMigrationAccounts(
          "draft-1",
          {
            expectedAccountCount:
              0,
            accounts: [],
          }
        ),
      /Supabase auth spike is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY\./
    );

    await assert.rejects(
      () =>
        adapter.stageMigrationTransactions(
          "draft-1",
          {
            expectedTransactionCount:
              0,
            transactions: [],
          }
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
  "Supabase auth adapter rejects invalid household claim memberships",
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
                  "",
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
      /Supabase household claim returned an invalid membership\./
    );
  }
);

test(
  "Supabase auth adapter rejects invalid household claim migration drafts",
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
                  "user-1",
                role:
                  "owner",
                membership_status:
                  "active",
                migration_draft_id:
                  "55555555-5555-4555-8555-555555555555",
                migration_status:
                  "unknown",
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
      /Supabase household claim returned an invalid migration draft\./
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
                              upload_staged_at:
                                null,
                              upload_staged_record_count:
                                null,
                              account_upload_staged_at:
                                null,
                              account_upload_staged_count:
                                null,
                              transaction_upload_staged_at:
                                null,
                              transaction_upload_staged_count:
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
            "id,household_id,owner_user_id,owner_member_id,household_name,status,validated_at,upload_staged_at,upload_staged_record_count,account_upload_staged_at,account_upload_staged_count,transaction_upload_staged_at,transaction_upload_staged_count,committed_at,aborted_at,created_at,updated_at",
          column:
            "id",
          value:
            "migration-1",
        },
        {
          tableName:
            "migration_drafts",
          columns:
            "id,household_id,owner_user_id,owner_member_id,household_name,status,validated_at,upload_staged_at,upload_staged_record_count,account_upload_staged_at,account_upload_staged_count,transaction_upload_staged_at,transaction_upload_staged_count,committed_at,aborted_at,created_at,updated_at",
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
        adapter.stageMigrationUploadManifest(
          "migration-1",
          {
            expectedRecordCount:
              16,
            counts: [],
          }
        ),
      /Sign in before staging a migration upload manifest\./
    );

    await assert.rejects(
      () =>
        adapter.stageMigrationAccounts(
          "migration-1",
          {
            expectedAccountCount:
              0,
            accounts: [],
          }
        ),
      /Sign in before staging migration accounts\./
    );

    await assert.rejects(
      () =>
        adapter.stageMigrationTransactions(
          "migration-1",
          {
            expectedTransactionCount:
              0,
            transactions: [],
          }
        ),
      /Sign in before staging migration transactions\./
    );

    await assert.rejects(
      () =>
        adapter.auditMigrationPreCommit(
          "migration-1"
        ),
      /Sign in before auditing a migration commit\./
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
  "Supabase auth adapter stages migration upload manifest through RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];
    const manifest = {
      expectedRecordCount:
        16,
      counts: [
        {
          id: "household",
          label: "Household",
          count: 1,
        },
        {
          id: "transactions",
          label: "Transactions",
          count: 15,
        },
      ],
    };

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
                staged_record_count:
                  16,
                staged_at:
                  "2026-07-22T04:30:00Z",
              },
              error: null,
            };
          },
        },
      });

    const staging =
      await adapter
        .stageMigrationUploadManifest(
          "migration-1",
          manifest
        );

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "stage_migration_upload_manifest",
          parameters: {
            target_draft_id:
              "migration-1",
            expected_record_count:
              16,
            draft_upload_manifest:
              manifest,
          },
        },
      ]
    );
    assert.equal(
      staging.draftId,
      "migration-1"
    );
    assert.equal(
      staging.stagedRecordCount,
      16
    );
    assert.equal(
      staging.stagedAt.toISOString(),
      "2026-07-22T04:30:00.000Z"
    );
  }
);

test(
  "Supabase auth adapter stages migration accounts through RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];
    const payload = {
      expectedAccountCount:
        1,
      accounts: [
        {
          id:
            "account-1",
          visibility:
            "household",
          name:
            "Main Cash",
          accountClass:
            "asset",
          type:
            "cash",
          currency:
            "PHP",
          openingBalance:
            100,
          currentBalance:
            150,
          isActive:
            true,
          createdAt:
            "2026-07-22T01:00:00.000Z",
          updatedAt:
            "2026-07-22T02:00:00.000Z",
        },
      ],
    };

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
                staged_account_count:
                  1,
                staged_at:
                  "2026-07-22T04:45:00Z",
              },
              error: null,
            };
          },
        },
      });

    const staging =
      await adapter
        .stageMigrationAccounts(
          "migration-1",
          payload
        );

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "stage_migration_accounts",
          parameters: {
            target_draft_id:
              "migration-1",
            expected_account_count:
              1,
            staged_accounts:
              payload.accounts,
          },
        },
      ]
    );
    assert.equal(
      staging.draftId,
      "migration-1"
    );
    assert.equal(
      staging.stagedAccountCount,
      1
    );
    assert.equal(
      staging.stagedAt.toISOString(),
      "2026-07-22T04:45:00.000Z"
    );
  }
);

test(
  "Supabase auth adapter requires sign-in before household preference actions",
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
        adapter.loadRemoteHousehold(
          "household-1"
        ),
      /Sign in before loading household preferences\./
    );

    await assert.rejects(
      () =>
        adapter.saveRemoteHouseholdPreferences({
          householdId:
            "household-1",
          name:
            "Casa Test",
          country:
            "PH",
          currency:
            "PHP",
          timezone:
            "Asia/Manila",
        }),
      /Sign in before saving household preferences\./
    );

    assert.deepEqual(
      rpcCalls,
      []
    );
  }
);

test(
  "Supabase auth adapter loads and saves household preferences through RPC",
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
                  "household-1",
                household_name:
                  functionName ===
                  "save_household_preferences"
                    ? "Casa Updated"
                    : "Casa Test",
                country:
                  "PH",
                currency:
                  "PHP",
                timezone:
                  "Asia/Manila",
                status:
                  "active",
                owner_member_id:
                  "member-owner",
                created_at:
                  "2026-07-22T01:00:00Z",
                updated_at:
                  "2026-07-22T04:50:00Z",
              },
              error: null,
            };
          },
        },
      });

    const saved =
      await adapter
        .saveRemoteHouseholdPreferences({
          householdId:
            "household-1",
          name:
            "Casa Updated",
          country:
            "PH",
          currency:
            "PHP",
          timezone:
            "Asia/Manila",
        });
    const loaded =
      await adapter
        .loadRemoteHousehold(
          "household-1"
        );

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "save_household_preferences",
          parameters: {
            target_household_id:
              "household-1",
            household_name:
              "Casa Updated",
            household_country:
              "PH",
            household_currency:
              "PHP",
            household_timezone:
              "Asia/Manila",
          },
        },
        {
          functionName:
            "load_household_preferences",
          parameters: {
            target_household_id:
              "household-1",
          },
        },
      ]
    );
    assert.equal(
      saved.name,
      "Casa Updated"
    );
    assert.equal(
      saved.ownerMemberId,
      "member-owner"
    );
    assert.equal(
      loaded.name,
      "Casa Test"
    );
    assert.equal(
      loaded.updatedAt.toISOString(),
      "2026-07-22T04:50:00.000Z"
    );
  }
);

test(
  "Supabase auth adapter requires sign-in before core snapshot actions",
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
        adapter.loadRemoteCoreSnapshot(
          "household-1"
        ),
      /Sign in before loading core finance records\./
    );

    await assert.rejects(
      () =>
        adapter.saveRemoteCoreSnapshot({
          householdId:
            "household-1",
          accounts: [],
          transactions: [],
        }),
      /Sign in before saving core finance records\./
    );

    assert.deepEqual(
      rpcCalls,
      []
    );
  }
);

test(
  "Supabase auth adapter loads and saves core snapshots through RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];
    const accounts = [
      {
        id:
          "account-1",
        visibility:
          "household",
        name:
          "Main Cash",
        accountClass:
          "asset",
        type:
          "cash",
        currency:
          "PHP",
        openingBalance:
          100,
        currentBalance:
          150,
        isActive:
          true,
        createdAt:
          "2026-07-22T01:00:00.000Z",
        updatedAt:
          "2026-07-22T02:00:00.000Z",
      },
    ];
    const transactions = [
      {
        id:
          "transaction-1",
        visibility:
          "household",
        type:
          "expense",
        amount:
          75,
        sourceAccountId:
          "account-1",
        destinationAccountId:
          null,
        category:
          "Groceries",
        description:
          "Market",
        notes:
          "",
        transactionDate:
          "2026-07-22",
        isActive:
          true,
        createdAt:
          "2026-07-22T03:00:00.000Z",
        updatedAt:
          "2026-07-22T03:30:00.000Z",
      },
    ];

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
                  "household-1",
                accounts,
                transactions,
                saved_at:
                  "2026-07-22T04:55:00Z",
              },
              error: null,
            };
          },
        },
      });

    const saved =
      await adapter
        .saveRemoteCoreSnapshot({
          householdId:
            "household-1",
          accounts,
          transactions,
        });
    const loaded =
      await adapter
        .loadRemoteCoreSnapshot(
          "household-1"
        );

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "save_household_core_snapshot",
          parameters: {
            target_household_id:
              "household-1",
            core_accounts:
              accounts,
            core_transactions:
              transactions,
          },
        },
        {
          functionName:
            "load_household_core_snapshot",
          parameters: {
            target_household_id:
              "household-1",
          },
        },
      ]
    );
    assert.equal(
      saved.accounts[0]?.name,
      "Main Cash"
    );
    assert.equal(
      loaded.transactions[0]
        ?.description,
      "Market"
    );
    assert.equal(
      saved.savedAt?.toISOString(),
      "2026-07-22T04:55:00.000Z"
    );
  }
);

test(
  "Supabase auth adapter requires sign-in before settlement write actions",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];
    const settlement = {
      householdId:
        "household-1",
      fromMemberId:
        "member-1",
      toMemberId:
        "member-2",
      amount: 100,
      settlementDate:
        "2026-07-30",
      applicationMethod:
        "oldest-first" as const,
      isActive: true,
    };

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
        adapter.createRemoteSettlement({
          settlement,
        }),
      /Sign in before creating a settlement\./
    );

    await assert.rejects(
      () =>
        adapter.updateRemoteSettlement({
          settlementId:
            "settlement-1",
          settlement,
        }),
      /Sign in before updating a settlement\./
    );

    await assert.rejects(
      () =>
        adapter.deleteRemoteSettlement(
          "household-1",
          "settlement-1"
        ),
      /Sign in before deleting a settlement\./
    );

    assert.deepEqual(
      rpcCalls,
      []
    );
  }
);

test(
  "Supabase auth adapter creates settlements through RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];
    const queries: unknown[] = [];

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
                id:
                  "settlement-1",
                household_id:
                  "household-1",
                local_record_id:
                  "local-settlement-1",
                from_member_id:
                  "member-1",
                to_member_id:
                  "member-2",
                amount:
                  100,
                settlement_date:
                  "2026-07-30",
                source_account_id:
                  null,
                destination_account_id:
                  null,
                application_method:
                  "oldest-first",
                reference_number:
                  "SET-001",
                notes:
                  null,
                is_active:
                  true,
                created_at:
                  "2026-07-30T01:00:00Z",
                updated_at:
                  "2026-07-30T01:00:00Z",
                updated_by_user_id:
                  "user-1",
              },
              error: null,
            };
          },
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
                            "application-1",
                          household_id:
                            "household-1",
                          local_record_id:
                            "local-application-1",
                          settlement_id:
                            "settlement-1",
                          expense_allocation_id:
                            "allocation-1",
                          applied_amount:
                            100,
                          created_at:
                            "2026-07-30T01:00:00Z",
                          updated_at:
                            "2026-07-30T01:00:00Z",
                          updated_by_user_id:
                            "user-1",
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

    const result =
      await adapter
        .createRemoteSettlement({
          settlement: {
            householdId:
              "household-1",
            localRecordId:
              "local-settlement-1",
            fromMemberId:
              "member-1",
            toMemberId:
              "member-2",
            amount: 100,
            settlementDate:
              "2026-07-30",
            applicationMethod:
              "oldest-first",
            referenceNumber:
              "SET-001",
            isActive: true,
          },
          applications: [
            {
              localRecordId:
                "local-application-1",
              expenseAllocationId:
                "allocation-1",
              appliedAmount:
                100,
            },
          ],
        });

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "create_household_settlement",
          parameters: {
            target_household_id:
              "household-1",
            local_record_id:
              "local-settlement-1",
            from_member_id:
              "member-1",
            to_member_id:
              "member-2",
            settlement_amount:
              100,
            settlement_date:
              "2026-07-30",
            source_account_id:
              null,
            destination_account_id:
              null,
            application_method:
              "oldest-first",
            reference_number:
              "SET-001",
            settlement_notes:
              null,
            is_active:
              true,
            settlement_applications: [
              {
                local_record_id:
                  "local-application-1",
                expense_allocation_id:
                  "allocation-1",
                applied_amount:
                  100,
              },
            ],
          },
        },
      ]
    );
    assert.equal(
      result.settlement.id,
      "settlement-1"
    );
    assert.equal(
      result.settlement.updatedByUserId,
      "user-1"
    );
    assert.equal(
      result.applications.length,
      1
    );
    assert.equal(
      result.applications[0]
        ?.expenseAllocationId,
      "allocation-1"
    );
    assert.deepEqual(
      queries.map(
        (query) =>
          (
            query as {
              tableName: string;
            }
          ).tableName
      ),
      [
        "settlement_applications",
      ]
    );
  }
);

test(
  "Supabase auth adapter updates and deletes settlements through RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];
    const queries: unknown[] = [];

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

            if (
              functionName ===
              "delete_household_settlement"
            ) {
              return {
                data: {
                  settlement_id:
                    "settlement-1",
                  deleted_at:
                    "2026-07-30T02:00:00Z",
                },
                error: null,
              };
            }

            return {
              data: {
                id:
                  "settlement-1",
                household_id:
                  "household-1",
                local_record_id:
                  "local-settlement-1",
                from_member_id:
                  "member-1",
                to_member_id:
                  "member-2",
                amount:
                  125,
                settlement_date:
                  "2026-07-30",
                source_account_id:
                  null,
                destination_account_id:
                  null,
                application_method:
                  "oldest-first",
                reference_number:
                  null,
                notes:
                  "Updated",
                is_active:
                  true,
                created_at:
                  "2026-07-30T01:00:00Z",
                updated_at:
                  "2026-07-30T02:00:00Z",
                updated_by_user_id:
                  "user-1",
              },
              error: null,
            };
          },
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
                            "application-2",
                          household_id:
                            "household-1",
                          local_record_id:
                            "local-application-2",
                          settlement_id:
                            "settlement-1",
                          expense_allocation_id:
                            "allocation-2",
                          applied_amount:
                            125,
                          created_at:
                            "2026-07-30T02:00:00Z",
                          updated_at:
                            "2026-07-30T02:00:00Z",
                          updated_by_user_id:
                            "user-1",
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

    const updated =
      await adapter
        .updateRemoteSettlement({
          settlementId:
            "settlement-1",
          settlement: {
            householdId:
              "household-1",
            localRecordId:
              "local-settlement-1",
            fromMemberId:
              "member-1",
            toMemberId:
              "member-2",
            amount: 125,
            settlementDate:
              "2026-07-30",
            applicationMethod:
              "oldest-first",
            notes:
              "Updated",
            isActive: true,
          },
          applications: [
            {
              localRecordId:
                "local-application-2",
              expenseAllocationId:
                "allocation-2",
              appliedAmount:
                125,
            },
          ],
        });

    await adapter.deleteRemoteSettlement(
      "household-1",
      "settlement-1"
    );

    assert.equal(
      updated.settlement.amount,
      125
    );
    assert.equal(
      updated.applications[0]
        ?.appliedAmount,
      125
    );
    assert.deepEqual(
      rpcCalls.map(
        (call) =>
          (
            call as {
              functionName: string;
            }
          ).functionName
      ),
      [
        "update_household_settlement",
        "delete_household_settlement",
      ]
    );
    assert.deepEqual(
      (
        rpcCalls[0] as {
          parameters: {
            settlement_applications:
              unknown;
          };
        }
      ).parameters
        .settlement_applications,
      [
        {
          local_record_id:
            "local-application-2",
          expense_allocation_id:
            "allocation-2",
          applied_amount:
            125,
        },
      ]
    );
    assert.deepEqual(
      queries.map(
        (query) =>
          (
            query as {
              tableName: string;
            }
          ).tableName
      ),
      [
        "settlement_applications",
      ]
    );
  }
);

test(
  "Supabase auth adapter stages migration transactions through RPC",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const rpcCalls: unknown[] = [];
    const payload = {
      expectedTransactionCount:
        1,
      transactions: [
        {
          id:
            "transaction-1",
          expenseSplitMethod:
            "equal",
          visibility:
            "household",
          type:
            "expense",
          amount:
            75,
          enteredAmount:
            75,
          enteredCurrency:
            "PHP",
          baseCurrency:
            "PHP",
          baseAmount:
            75,
          exchangeRate:
            1,
          exchangeRateEffectiveDate:
            "2026-07-22",
          exchangeRateSource:
            "manual",
          sourceAccountId:
            "account-1",
          destinationAccountId:
            null,
          category:
            "Groceries",
          description:
            "Market",
          notes:
            "",
          attachments:
            [],
          transactionDate:
            "2026-07-22",
          isActive:
            true,
          createdAt:
            "2026-07-22T01:00:00.000Z",
          updatedAt:
            "2026-07-22T02:00:00.000Z",
        },
      ],
    };

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
                staged_transaction_count:
                  1,
                staged_at:
                  "2026-07-22T04:50:00Z",
              },
              error: null,
            };
          },
        },
      });

    const staging =
      await adapter
        .stageMigrationTransactions(
          "migration-1",
          payload
        );

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "stage_migration_transactions",
          parameters: {
            target_draft_id:
              "migration-1",
            expected_transaction_count:
              1,
            staged_transactions:
              payload.transactions,
          },
        },
      ]
    );
    assert.equal(
      staging.draftId,
      "migration-1"
    );
    assert.equal(
      staging.stagedTransactionCount,
      1
    );
    assert.equal(
      staging.stagedAt.toISOString(),
      "2026-07-22T04:50:00.000Z"
    );
  }
);

test(
  "Supabase auth adapter audits migration pre-commit readiness through RPC",
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
                is_ready:
                  true,
                blocker_count:
                  0,
                warning_count:
                  0,
                blockers: [],
                warnings: [],
                account_count:
                  7,
                transaction_count:
                  32,
                missing_expense_source_account_count:
                  0,
                missing_transaction_account_link_count:
                  0,
                audited_at:
                  "2026-07-22T04:55:00Z",
              },
              error: null,
            };
          },
        },
      });

    const audit =
      await adapter
        .auditMigrationPreCommit(
          "migration-1"
        );

    assert.deepEqual(
      rpcCalls,
      [
        {
          functionName:
            "audit_migration_precommit",
          parameters: {
            target_draft_id:
              "migration-1",
          },
        },
      ]
    );
    assert.deepEqual(
      audit,
      {
        draftId:
          "migration-1",
        isReady:
          true,
        blockerCount:
          0,
        warningCount:
          0,
        blockers: [],
        warnings: [],
        accountCount:
          7,
        transactionCount:
          32,
        missingExpenseSourceAccountCount:
          0,
        missingTransactionAccountLinkCount:
          0,
        auditedAt:
          new Date(
            "2026-07-22T04:55:00Z"
          ),
      }
    );
  }
);

test(
  "Supabase auth adapter rejects invalid migration pre-commit audit results",
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
                  "other-migration",
                is_ready:
                  true,
                blocker_count:
                  0,
                warning_count:
                  0,
                blockers: [],
                warnings: [],
                account_count:
                  7,
                transaction_count:
                  32,
                missing_expense_source_account_count:
                  0,
                missing_transaction_account_link_count:
                  0,
              },
              error: null,
            };
          },
        },
      });

    await assert.rejects(
      () =>
        adapter.auditMigrationPreCommit(
          "migration-1"
        ),
      /Supabase migration pre-commit audit returned an invalid result\./
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
  "Supabase auth adapter subscribes to core snapshot realtime changes",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    let callback:
      | (() => void)
      | undefined;
    let channelTopic = "";
    let channelFilter:
      | Record<string, unknown>
      | undefined;
    let removeChannelCount = 0;
    let changeCount = 0;

    const channel = {
      on(
        type: string,
        filter:
          Record<string, unknown>,
        onChange: () => void
      ) {
        assert.equal(
          type,
          "postgres_changes"
        );
        channelFilter =
          filter;
        callback =
          onChange;

        return channel;
      },
      subscribe() {
        return channel;
      },
    };

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedInClient(),
          channel(topic: string) {
            channelTopic =
              topic;

            return channel;
          },
          async removeChannel(
            selectedChannel: unknown
          ) {
            assert.equal(
              selectedChannel,
              channel
            );
            removeChannelCount += 1;
          },
        },
      });

    const subscription =
      adapter.subscribeToCoreSnapshotChanges(
        "household-1",
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
    assert.equal(
      channelTopic,
      "hfos-core-snapshot-household-1"
    );
    assert.deepEqual(
      channelFilter,
      {
        event: "*",
        schema: "public",
        table:
          "household_core_snapshots",
        filter:
          "household_id=eq.household-1",
      }
    );

    subscription.unsubscribe();
    await Promise.resolve();
    await Promise.resolve();
    callback?.();

    assert.equal(
      removeChannelCount,
      1
    );
    assert.equal(
      changeCount,
      1
    );
  }
);

test(
  "Supabase auth adapter subscribes to settlement realtime changes",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    let callback:
      | (() => void)
      | undefined;
    let channelTopic = "";
    let channelFilter:
      | Record<string, unknown>
      | undefined;
    let removeChannelCount = 0;
    let changeCount = 0;

    const channel = {
      on(
        type: string,
        filter:
          Record<string, unknown>,
        onChange: () => void
      ) {
        assert.equal(
          type,
          "postgres_changes"
        );
        channelFilter =
          filter;
        callback =
          onChange;

        return channel;
      },
      subscribe() {
        return channel;
      },
    };

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedInClient(),
          channel(topic: string) {
            channelTopic =
              topic;

            return channel;
          },
          async removeChannel(
            selectedChannel: unknown
          ) {
            assert.equal(
              selectedChannel,
              channel
            );
            removeChannelCount += 1;
          },
        },
      });

    const subscription =
      adapter.subscribeToSettlementChanges(
        "household-1",
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
    assert.equal(
      channelTopic,
      "hfos-settlements-household-1"
    );
    assert.deepEqual(
      channelFilter,
      {
        event: "*",
        schema: "public",
        table:
          "settlements",
        filter:
          "household_id=eq.household-1",
      }
    );

    subscription.unsubscribe();
    await Promise.resolve();
    await Promise.resolve();
    callback?.();

    assert.equal(
      removeChannelCount,
      1
    );
    assert.equal(
      changeCount,
      1
    );
  }
);

test(
  "Supabase auth adapter subscribes to household preference realtime changes",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    let callback:
      | (() => void)
      | undefined;
    let channelTopic = "";
    let channelFilter:
      | Record<string, unknown>
      | undefined;
    let removeChannelCount = 0;
    let changeCount = 0;

    const channel = {
      on(
        type: string,
        filter:
          Record<string, unknown>,
        onChange: () => void
      ) {
        assert.equal(
          type,
          "postgres_changes"
        );
        channelFilter =
          filter;
        callback =
          onChange;

        return channel;
      },
      subscribe() {
        return channel;
      },
    };

    const adapter =
      new SupabaseAuthBackendAdapter({
        projectUrl:
          "https://example.supabase.co",
        anonKey:
          "anon-key",
        client: {
          ...createSignedInClient(),
          channel(topic: string) {
            channelTopic =
              topic;

            return channel;
          },
          async removeChannel(
            selectedChannel: unknown
          ) {
            assert.equal(
              selectedChannel,
              channel
            );
            removeChannelCount += 1;
          },
        },
      });

    const subscription =
      adapter
        .subscribeToHouseholdPreferenceChanges(
          "household-1",
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
    assert.equal(
      channelTopic,
      "hfos-household-preferences-household-1"
    );
    assert.deepEqual(
      channelFilter,
      {
        event: "*",
        schema: "public",
        table:
          "households",
        filter:
          "id=eq.household-1",
      }
    );

    subscription.unsubscribe();
    await Promise.resolve();
    await Promise.resolve();
    callback?.();

    assert.equal(
      removeChannelCount,
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
                          source_account_id:
                            "account-1",
                          destination_account_id:
                            null,
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
                          source_account_id:
                            null,
                          destination_account_id:
                            null,
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
                          source_account_id:
                            "account-2",
                          destination_account_id:
                            "account-3",
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
            "household_id,type,visibility,transaction_date,is_active,source_account_id,destination_account_id",
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
        sourceAccountLinkedCount:
          2,
        destinationAccountLinkedCount:
          1,
        missingAccountLinkCount:
          1,
        expenseMissingSourceAccountCount:
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
                          backup_summary: {
                            householdName:
                              "Casa Test",
                            exportedAt:
                              "2026-07-22T01:30:00Z",
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
                          },
                          status:
                            "uploaded",
                          validated_at:
                            "2026-07-22T04:00:00Z",
                          upload_staged_at:
                            "2026-07-22T04:30:00Z",
                          upload_staged_record_count:
                            16,
                          account_upload_staged_at:
                            "2026-07-22T04:45:00Z",
                          account_upload_staged_count:
                            2,
                          transaction_upload_staged_at:
                            "2026-07-22T04:50:00Z",
                          transaction_upload_staged_count:
                            3,
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
                          upload_staged_at:
                            null,
                          upload_staged_record_count:
                            null,
                          account_upload_staged_at:
                            null,
                          account_upload_staged_count:
                            null,
                          transaction_upload_staged_at:
                            null,
                          transaction_upload_staged_count:
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
            "id,household_id,owner_user_id,owner_member_id,household_name,backup_summary,status,validated_at,upload_staged_at,upload_staged_record_count,account_upload_staged_at,account_upload_staged_count,transaction_upload_staged_at,transaction_upload_staged_count,committed_at,aborted_at,created_at,updated_at",
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
      2
    );
    assert.equal(
      drafts[0]?.backupSummary.transactionCount,
      3
    );
    assert.equal(
      drafts[0]?.backupSummary.providerBillCount,
      1
    );
    assert.equal(
      drafts[0]?.backupSummary.exportedAt,
      "2026-07-22T01:30:00Z"
    );
    assert.equal(
      drafts[0]?.remoteRecordCount,
      16
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
      drafts[0]?.uploadStagedAt?.toISOString(),
      "2026-07-22T04:30:00.000Z"
    );
    assert.equal(
      drafts[0]?.uploadStagedRecordCount,
      16
    );
    assert.equal(
      drafts[0]?.accountUploadStagedAt?.toISOString(),
      "2026-07-22T04:45:00.000Z"
    );
    assert.equal(
      drafts[0]?.accountUploadStagedCount,
      2
    );
    assert.equal(
      drafts[0]?.transactionUploadStagedAt?.toISOString(),
      "2026-07-22T04:50:00.000Z"
    );
    assert.equal(
      drafts[0]?.transactionUploadStagedCount,
      3
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
  "Supabase auth adapter probes cloud schema readiness",
  async () => {
    const {
      SupabaseAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/supabaseAuthBackendAdapter.ts"
    );
    const probes: unknown[] = [];

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
                  async eq(
                    column: string,
                    value: string
                  ) {
                    probes.push({
                      tableName,
                      columns,
                      column,
                      value,
                    });

                    return {
                      data: [],
                      error:
                        tableName ===
                        "settlements"
                          ? {
                              message:
                                "settlements unavailable",
                            }
                          : null,
                    };
                  },
                };
              },
            };
          },
        },
      });

    const checks =
      await adapter
        .listSchemaReadinessChecks();

    assert.deepEqual(
      probes.map(
        (probe) =>
          (probe as {
            tableName: string;
          }).tableName
      ),
      [
        "accounts",
        "transactions",
        "expense_allocations",
        "utility_provider_bills",
        "settlements",
        "settlement_applications",
        "savings_goals",
        "savings_activities",
      ]
    );
    assert.equal(
      checks.length,
      8
    );
    assert.equal(
      checks.find(
        (check) =>
          check.id ===
          "settlements"
      )?.ready,
      false
    );
    assert.equal(
      checks.find(
        (check) =>
          check.id ===
          "accounts"
      )?.ready,
      true
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
