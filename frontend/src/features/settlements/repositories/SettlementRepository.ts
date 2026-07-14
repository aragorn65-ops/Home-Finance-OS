import type { Settlement } from "../models/Settlement";

export default class SettlementRepository {
  /**
   * Demo in-memory data source.
   *
   * Replace with database or API persistence
   * in a future sprint.
   */
  private static settlements: Settlement[] = [];

  /**
   * Returns all settlement records.
   */
  static findAll(): Settlement[] {
    return this.settlements.map(
      (settlement) =>
        this.clone(settlement)
    );
  }

  /**
   * Finds a settlement by ID.
   */
  static findById(
    id: string
  ): Settlement | undefined {
    const settlement =
      this.settlements.find(
        (item) => item.id === id
      );

    return settlement
      ? this.clone(settlement)
      : undefined;
  }

  /**
   * Returns all settlements belonging
   * to a household.
   */
  static findByHouseholdId(
    householdId: string
  ): Settlement[] {
    return this.settlements
      .filter(
        (settlement) =>
          settlement.householdId ===
          householdId
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Returns active settlements belonging
   * to a household.
   */
  static findActiveByHouseholdId(
    householdId: string
  ): Settlement[] {
    return this.settlements
      .filter(
        (settlement) =>
          settlement.householdId ===
            householdId &&
          settlement.isActive
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Returns settlements paid by a member.
   */
  static findByFromMemberId(
    fromMemberId: string
  ): Settlement[] {
    return this.settlements
      .filter(
        (settlement) =>
          settlement.fromMemberId ===
          fromMemberId
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Returns settlements received by a member.
   */
  static findByToMemberId(
    toMemberId: string
  ): Settlement[] {
    return this.settlements
      .filter(
        (settlement) =>
          settlement.toMemberId ===
          toMemberId
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Returns settlements transferred
   * between two members.
   */
  static findBetweenMembers(
    householdId: string,
    fromMemberId: string,
    toMemberId: string
  ): Settlement[] {
    return this.settlements
      .filter(
        (settlement) =>
          settlement.householdId ===
            householdId &&
          settlement.fromMemberId ===
            fromMemberId &&
          settlement.toMemberId ===
            toMemberId
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Creates a settlement record.
   */
  static create(
    settlement: Settlement
  ): Settlement {
    const storedSettlement =
      this.clone(settlement);

    this.settlements.push(
      storedSettlement
    );

    return this.clone(
      storedSettlement
    );
  }

  /**
   * Updates an existing settlement record.
   */
  static update(
    settlement: Settlement
  ): Settlement | undefined {
    const settlementIndex =
      this.settlements.findIndex(
        (item) =>
          item.id === settlement.id
      );

    if (settlementIndex === -1) {
      return undefined;
    }

    const storedSettlement =
      this.clone(settlement);

    this.settlements[
      settlementIndex
    ] = storedSettlement;

    return this.clone(
      storedSettlement
    );
  }

  /**
   * Deletes a settlement record.
   */
  static delete(
    id: string
  ): boolean {
    const settlementIndex =
      this.settlements.findIndex(
        (settlement) =>
          settlement.id === id
      );

    if (settlementIndex === -1) {
      return false;
    }

    this.settlements.splice(
      settlementIndex,
      1
    );

    return true;
  }

  /**
   * Returns a defensive settlement copy.
   */
  private static clone(
    settlement: Settlement
  ): Settlement {
    return {
      ...settlement,

      settlementDate:
        new Date(
          settlement.settlementDate
        ),

      createdAt:
        new Date(
          settlement.createdAt
        ),

      updatedAt:
        new Date(
          settlement.updatedAt
        ),
    };
  }
}