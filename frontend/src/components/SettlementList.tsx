import SettlementCard from "./SettlementCard";
import { members } from "../data/mockData";
import { useSettlements } from "../hooks/useSettlements";

export default function SettlementList() {
  const { settlements } = useSettlements();

  return (
    <>
      {settlements.map((settlement) => (
        <SettlementCard
          key={settlement.id}
          settlement={settlement}
          members={members}
        />
      ))}
    </>
  );
}