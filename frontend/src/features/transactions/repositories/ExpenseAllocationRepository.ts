import type { ExpenseAllocation } from "../models/ExpenseAllocation";

export default class ExpenseAllocationRepository {
  /**
   * Demo in-memory data source.
   *
   * Replace with database or API persistence
   * in a future sprint.
   */
  private static allocations: ExpenseAllocation[] = [];

  /**
   * Returns all expense allocations.
   */
  static findAll(): ExpenseAllocation[] {
    return this.allocations.map((allocation) =>
      this.clone(allocation)
    );
  }

  /**
   * Finds an expense allocation by ID.
   */
  static findById(
    id: string
  ): ExpenseAllocation | undefined {
    const allocation = this.allocations.find(
      (item) => item.id === id
    );

    return allocation
      ? this.clone(allocation)
      : undefined;
  }

  /**
   * Returns every allocation belonging to a transaction.
   */
  static findByTransactionId(
    transactionId: string
  ): ExpenseAllocation[] {
    return this.allocations
      .filter(
        (allocation) =>
          allocation.transactionId === transactionId
      )
      .map((allocation) =>
        this.clone(allocation)
      );
  }

  /**
   * Returns every allocation assigned to a member.
   */
  static findByMemberId(
    memberId: string
  ): ExpenseAllocation[] {
    return this.allocations
      .filter(
        (allocation) =>
          allocation.memberId === memberId
      )
      .map((allocation) =>
        this.clone(allocation)
      );
  }

  /**
   * Returns allocations for expenses paid by a member.
   */
  static findByPaidByMemberId(
    paidByMemberId: string
  ): ExpenseAllocation[] {
    return this.allocations
      .filter(
        (allocation) =>
          allocation.paidByMemberId ===
          paidByMemberId
      )
      .map((allocation) =>
        this.clone(allocation)
      );
  }

  /**
   * Creates multiple expense allocations.
   */
  static createMany(
    allocations: ExpenseAllocation[]
  ): ExpenseAllocation[] {
    const storedAllocations =
      allocations.map((allocation) =>
        this.clone(allocation)
      );

    this.allocations.push(
      ...storedAllocations
    );

    return storedAllocations.map(
      (allocation) =>
        this.clone(allocation)
    );
  }

  /**
   * Replaces all allocations belonging to a transaction.
   *
   * Used when an expense transaction is edited.
   */
  static replaceByTransactionId(
    transactionId: string,
    allocations: ExpenseAllocation[]
  ): ExpenseAllocation[] {
    this.allocations =
      this.allocations.filter(
        (allocation) =>
          allocation.transactionId !==
          transactionId
      );

    return this.createMany(allocations);
  }

  /**
   * Deletes all allocations belonging to a transaction.
   */
  static deleteByTransactionId(
    transactionId: string
  ): boolean {
    const originalCount =
      this.allocations.length;

    this.allocations =
      this.allocations.filter(
        (allocation) =>
          allocation.transactionId !==
          transactionId
      );

    return (
      this.allocations.length <
      originalCount
    );
  }

  /**
   * Deletes one allocation.
   */
  static delete(id: string): boolean {
    const allocationIndex =
      this.allocations.findIndex(
        (allocation) =>
          allocation.id === id
      );

    if (allocationIndex === -1) {
      return false;
    }

    this.allocations.splice(
      allocationIndex,
      1
    );

    return true;
  }

  /**
   * Returns a defensive allocation copy.
   */
  private static clone(
    allocation: ExpenseAllocation
  ): ExpenseAllocation {
    return {
      ...allocation,

      createdAt: new Date(
        allocation.createdAt
      ),

      updatedAt: new Date(
        allocation.updatedAt
      ),
    };
  }
}
