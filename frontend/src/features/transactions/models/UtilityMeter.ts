import type { HouseholdMember } from "../../household/models/HouseholdMember";

export type UtilityType =
  | "electricity"
  | "water";

export type UtilityUnit =
  | "kWh"
  | "m3";

export interface UtilityMeter {
  id: string;
  householdId: string;

  /**
   * Member whose usage is measured by this submeter.
   */
  memberId: HouseholdMember["id"];

  utilityType: UtilityType;
  unit: UtilityUnit;

  /**
   * User-facing meter name.
   *
   * Examples:
   * - Dadi Bedroom Electricity
   * - Rasha Water Submeter
   */
  name: string;

  /**
   * Optional physical meter number or reference.
   */
  meterNumber?: string;

  /**
   * Most recent finalized reading.
   *
   * This becomes the default previous reading
   * for the next utility expense.
   */
  latestReading: number;

  /**
   * Date associated with the most recent
   * finalized meter reading.
   */
  latestReadingDate?: Date;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}