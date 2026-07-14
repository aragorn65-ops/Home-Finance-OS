import type { SettlementApplication } from "../models/SettlementApplication";

export default class SettlementApplicationRepository {
  /**
   * Demo in-memory data source.
   *
   * Replace with database or API persistence
   * in a future sprint.
   */
  private static applications: SettlementApplication[] = [];

  /**
   * Returns all settlement applications.
   */
  static findAll(): SettlementApplication[] {
    return this.applications.map((application) =>
      this.clone(application)
    );
  }

  /**
   * Finds a settlement application by ID.
   */
  static findById(
    id: string
  ): SettlementApplication | undefined {
    const application = this.applications.find(
      (item) => item.id === id
    );

    return application
      ? this.clone(application)
      : undefined;
  }

  /**
   * Returns every application belonging to a settlement.
   */
  static findBySettlementId(
    settlementId: string
  ): SettlementApplication[] {
    return this.applications
      .filter(
        (application) =>
          application.settlementId === settlementId
      )
      .map((application) =>
        this.clone(application)
      );
  }

  /**
   * Returns every settlement application applied
   * to an expense allocation.
   */
  static findByExpenseAllocationId(
    expenseAllocationId: string
  ): SettlementApplication[] {
    return this.applications
      .filter(
        (application) =>
          application.expenseAllocationId ===
          expenseAllocationId
      )
      .map((application) =>
        this.clone(application)
      );
  }

  /**
   * Returns the total amount applied from a settlement.
   */
  static getAppliedAmountBySettlementId(
    settlementId: string
  ): number {
    return this.applications
      .filter(
        (application) =>
          application.settlementId === settlementId
      )
      .reduce(
        (total, application) =>
          total + application.appliedAmount,
        0
      );
  }

  /**
   * Returns the total amount paid toward
   * an expense allocation.
   */
  static getPaidAmountByExpenseAllocationId(
    expenseAllocationId: string
  ): number {
    return this.applications
      .filter(
        (application) =>
          application.expenseAllocationId ===
          expenseAllocationId
      )
      .reduce(
        (total, application) =>
          total + application.appliedAmount,
        0
      );
  }

  /**
   * Creates one settlement application.
   */
  static create(
    application: SettlementApplication
  ): SettlementApplication {
    const storedApplication =
      this.clone(application);

    this.applications.push(
      storedApplication
    );

    return this.clone(storedApplication);
  }

  /**
   * Creates multiple settlement applications.
   */
  static createMany(
    applications: SettlementApplication[]
  ): SettlementApplication[] {
    const storedApplications =
      applications.map((application) =>
        this.clone(application)
      );

    this.applications.push(
      ...storedApplications
    );

    return storedApplications.map(
      (application) =>
        this.clone(application)
    );
  }

  /**
   * Replaces all applications belonging to a settlement.
   *
   * Used when a settlement is edited.
   */
  static replaceBySettlementId(
    settlementId: string,
    applications: SettlementApplication[]
  ): SettlementApplication[] {
    this.applications =
      this.applications.filter(
        (application) =>
          application.settlementId !==
          settlementId
      );

    return this.createMany(applications);
  }

  /**
   * Deletes all applications belonging to a settlement.
   */
  static deleteBySettlementId(
    settlementId: string
  ): boolean {
    const originalCount =
      this.applications.length;

    this.applications =
      this.applications.filter(
        (application) =>
          application.settlementId !==
          settlementId
      );

    return (
      this.applications.length <
      originalCount
    );
  }

  /**
   * Deletes all settlement applications applied
   * to an expense allocation.
   */
  static deleteByExpenseAllocationId(
    expenseAllocationId: string
  ): boolean {
    const originalCount =
      this.applications.length;

    this.applications =
      this.applications.filter(
        (application) =>
          application.expenseAllocationId !==
          expenseAllocationId
      );

    return (
      this.applications.length <
      originalCount
    );
  }

  /**
   * Deletes one settlement application.
   */
  static delete(id: string): boolean {
    const applicationIndex =
      this.applications.findIndex(
        (application) =>
          application.id === id
      );

    if (applicationIndex === -1) {
      return false;
    }

    this.applications.splice(
      applicationIndex,
      1
    );

    return true;
  }

  /**
   * Returns a defensive settlement-application copy.
   */
  private static clone(
    application: SettlementApplication
  ): SettlementApplication {
    return {
      ...application,

      createdAt: new Date(
        application.createdAt
      ),

      updatedAt: new Date(
        application.updatedAt
      ),
    };
  }
}
