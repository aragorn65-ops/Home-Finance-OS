import { useState } from "react";
import { settlements as initialSettlements } from "../data/mockData";
import type { Settlement } from "../types/settlement";

export function useSettlements() {
  const [settlements, setSettlements] =
    useState<Settlement[]>(initialSettlements);

  function addSettlement(
    settlement: Omit<Settlement, "id">
  ) {
    const newSettlement: Settlement = {
      ...settlement,
      id: crypto.randomUUID(),
    };

    setSettlements((prev) => [
      newSettlement,
      ...prev,
    ]);
  }

  function deleteSettlement(id: string) {
    setSettlements((prev) =>
      prev.filter((s) => s.id !== id)
    );
  }

  function updateSettlement(updated: Settlement) {
    setSettlements((prev) =>
      prev.map((s) =>
        s.id === updated.id ? updated : s
      )
    );
  }

  return {
    settlements,
    addSettlement,
    deleteSettlement,
    updateSettlement,
  };
}