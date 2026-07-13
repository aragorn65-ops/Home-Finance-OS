import type { ExpenseAllocation } from "./ExpenseAllocation";
import type {
  UtilityMeter,
  UtilityType,
  UtilityUnit,
} from "./UtilityMeter";

export type UtilityCalculationMethod =
  | "shared-only"
  | "submeter"
  | "appliance-usage";

export interface UtilityAllocationDetails {
  id: string;

  expenseAllocationId: ExpenseAllocation["id"];

  utilityType: UtilityType;
  calculationMethod: UtilityCalculationMethod;

  /**
   * Measurement unit used for submeter calculations.
   *
   * Electricity uses kWh.
   * Water uses m3.
   */
  unit?: UtilityUnit;

  /**
   * Optional linked submeter.
   *
   * Required when calculationMethod is "submeter".
   */
  utilityMeterId?: UtilityMeter["id"];

  /**
   * Submeter calculation fields.
   *
   * Usage quantity is calculated as:
   * currentReading - previousReading
   */
  previousReading?: number;
  currentReading?: number;
  usageQuantity?: number;

  /**
   * Manually entered utility rate.
   *
   * Electricity:
   * Cost per kWh
   *
   * Water:
   * Cost per m3
   */
  ratePerUnit?: number;

  /**
   * Calculated submeter charge.
   *
   * usageQuantity × ratePerUnit
   */
  meteredUsageAmount?: number;

  /**
   * Appliance usage calculation fields.
   *
   * Initially intended for electricity expenses,
   * particularly air-conditioner usage.
   */
  applianceName?: string;

  /**
   * Appliance power consumption in kilowatts.
   *
   * Example:
   * A 1.2 kW air conditioner.
   */
  appliancePowerKw?: number;

  /**
   * Total appliance usage hours for the billing period.
   */
  applianceUsageHours?: number;

  /**
   * Calculated appliance usage charge.
   *
   * applianceUsageHours
   * × appliancePowerKw
   * × ratePerUnit
   */
  applianceUsageAmount?: number;

  /**
   * Amount assigned to this member from the portion
   * of the utility bill not covered by measured or
   * appliance-specific usage.
   *
   * Opted-out members must receive zero.
   */
  sharedRemainderAmount?: number;

  /**
   * Manual positive or negative correction.
   *
   * Examples:
   * - Shared lighting
   * - Common appliances
   * - Billing adjustments
   * - Estimated usage
   * - Credits
   */
  manualAdjustment?: number;

  createdAt: Date;
  updatedAt: Date;
}