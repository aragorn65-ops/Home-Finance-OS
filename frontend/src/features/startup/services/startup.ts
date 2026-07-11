import { loadHousehold } from "../../household/services/householdStorage";

export function hasHousehold(): boolean {
  return loadHousehold() !== null;
}