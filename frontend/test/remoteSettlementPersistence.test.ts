import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryAuthBackendAdapter,
  createMembership,
} from "../src/features/auth/services/index.ts";
import type {
  AuthUser,
} from "../src/features/auth/models/index.ts";

const householdId =
  "household-remote-1";

const adminUser: AuthUser = {
  id: "user-admin",
  email: "admin@hfos.local",
  createdAt:
    new Date("2026-07-30T00:00:00.000Z"),
  updatedAt:
    new Date("2026-07-30T00:00:00.000Z"),
};

const memberUser: AuthUser = {
  id: "user-member",
  email: "member@hfos.local",
  createdAt:
    new Date("2026-07-30T00:00:00.000Z"),
  updatedAt:
    new Date("2026-07-30T00:00:00.000Z"),
};

const uninvolvedUser: AuthUser = {
  id: "user-uninvolved",
  email: "uninvolved@hfos.local",
  createdAt:
    new Date("2026-07-30T00:00:00.000Z"),
  updatedAt:
    new Date("2026-07-30T00:00:00.000Z"),
};

function createAdapter(
  user: AuthUser
) {
  return new InMemoryAuthBackendAdapter({
    user,
    households: [
      {
        id: householdId,
        name: "Remote Household",
        ownerMemberId:
          "member-admin",
        status: "active",
        createdAt:
          new Date(
            "2026-07-30T00:00:00.000Z"
          ),
        updatedAt:
          new Date(
            "2026-07-30T00:00:00.000Z"
          ),
      },
    ],
    memberships: [
      createMembership({
        householdId,
        userId:
          adminUser.id,
        memberId:
          "member-admin",
        role: "admin",
      }),
      createMembership({
        householdId,
        userId:
          memberUser.id,
        memberId:
          "member-1",
        role: "member",
      }),
      createMembership({
        householdId,
        userId:
          uninvolvedUser.id,
        memberId:
          "member-3",
        role: "member",
      }),
    ],
  });
}

function createSettlementDraft() {
  return {
    householdId,
    localRecordId:
      "settlement-local-1",
    fromMemberId:
      "member-1",
    toMemberId:
      "member-2",
    amount: 100,
    settlementDate:
      "2026-07-30",
    applicationMethod:
      "oldest-first" as const,
    referenceNumber:
      "SET-001",
    notes: "",
    isActive: true,
  };
}

test("remote settlement persistence allows admin management", async () => {
  const adapter =
    createAdapter(adminUser);

  const created =
    await adapter.createRemoteSettlement({
      settlement:
        createSettlementDraft(),
      applications: [
        {
          localRecordId:
            "application-local-1",
          expenseAllocationId:
            "allocation-1",
          appliedAmount: 100,
        },
      ],
    });

  assert.equal(
    created.settlement.amount,
    100
  );
  assert.equal(
    created.applications.length,
    1
  );

  const updated =
    await adapter.updateRemoteSettlement({
      settlementId:
        created.settlement.id,
      settlement: {
        ...createSettlementDraft(),
        amount: 125,
      },
      applications: [],
    });

  assert.equal(
    updated.settlement.amount,
    125
  );

  await adapter.deleteRemoteSettlement(
    householdId,
    created.settlement.id
  );

  assert.equal(
    (
      await adapter.listRemoteSettlements(
        householdId
      )
    ).length,
    0
  );
});

test("remote settlement persistence allows involved member creation only", async () => {
  const memberAdapter =
    createAdapter(memberUser);
  const created =
    await memberAdapter
      .createRemoteSettlement({
        settlement:
          createSettlementDraft(),
      });

  assert.equal(
    created.settlement.fromMemberId,
    "member-1"
  );

  const uninvolvedAdapter =
    createAdapter(uninvolvedUser);

  await assert.rejects(
    () =>
      uninvolvedAdapter
        .createRemoteSettlement({
          settlement:
            createSettlementDraft(),
        }),
    /Current user cannot create this settlement\./
  );
});

test("remote settlement persistence lets admin revise member-submitted records", async () => {
  const memberAdapter =
    createAdapter(memberUser);
  const submitted =
    await memberAdapter
      .createRemoteSettlement({
        settlement:
          createSettlementDraft(),
      });
  const adminAdapter =
    new InMemoryAuthBackendAdapter({
      user: adminUser,
      memberships: [
        createMembership({
          householdId,
          userId:
            adminUser.id,
          memberId:
            "member-admin",
          role: "admin",
        }),
      ],
      settlements: [
        submitted.settlement,
      ],
      settlementApplications:
        submitted.applications,
    });

  const updated =
    await adminAdapter
      .updateRemoteSettlement({
        settlementId:
          submitted.settlement.id,
        settlement: {
          ...createSettlementDraft(),
          amount: 175,
          notes:
            "Admin reviewed.",
        },
      });

  assert.equal(
    updated.settlement.amount,
    175
  );
  assert.equal(
    updated.settlement.notes,
    "Admin reviewed."
  );

  await adminAdapter
    .deleteRemoteSettlement(
      householdId,
      submitted.settlement.id
    );

  assert.equal(
    (
      await adminAdapter
        .listRemoteSettlements(
          householdId
        )
    ).length,
    0
  );
});

test("remote settlement persistence blocks member update and delete", async () => {
  const adminAdapter =
    createAdapter(adminUser);
  const created =
    await adminAdapter
      .createRemoteSettlement({
        settlement:
          createSettlementDraft(),
      });
  const memberAdapter =
    new InMemoryAuthBackendAdapter({
      user: memberUser,
      memberships: [
        createMembership({
          householdId,
          userId:
            memberUser.id,
          memberId:
            "member-1",
          role: "member",
        }),
      ],
      settlements: [
        created.settlement,
      ],
    });

  await assert.rejects(
    () =>
      memberAdapter
        .updateRemoteSettlement({
          settlementId:
            created.settlement.id,
          settlement:
            createSettlementDraft(),
        }),
    /Current user cannot update this settlement\./
  );

  await assert.rejects(
    () =>
      memberAdapter
        .deleteRemoteSettlement(
          householdId,
          created.settlement.id
        ),
    /Current user cannot delete this settlement\./
  );
});

test("remote settlement persistence notifies subscribers", async () => {
  const adapter =
    createAdapter(adminUser);
  let notificationCount = 0;

  const subscription =
    adapter.subscribeToSettlementChanges(
      householdId,
      () => {
        notificationCount += 1;
      }
    );

  const created =
    await adapter.createRemoteSettlement({
      settlement:
        createSettlementDraft(),
    });

  await adapter.updateRemoteSettlement({
    settlementId:
      created.settlement.id,
    settlement: {
      ...createSettlementDraft(),
      amount: 150,
    },
  });

  subscription.unsubscribe();

  await adapter.deleteRemoteSettlement(
    householdId,
    created.settlement.id
  );

  assert.equal(
    notificationCount,
    2
  );
});
