import type { Settlement, Member } from "../types/settlement";
import { formatPeso } from "../lib/formatPeso";
import { format } from "date-fns";

interface Props {
  settlement: Settlement;
  members: Member[];
}

export default function SettlementCard({
  settlement,
  members,
}: Props) {
  const from = members.find((m) => m.id === settlement.fromMember);
  const to = members.find((m) => m.id === settlement.toMember);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      }}
    >
      <h3>{formatPeso(settlement.amount)}</h3>

      <p>
        <strong>From:</strong>{" "}
        <span style={{ color: from?.color }}>{from?.name}</span>
      </p>

      <p>
        <strong>To:</strong>{" "}
        <span style={{ color: to?.color }}>{to?.name}</span>
      </p>

      <p>{settlement.notes}</p>

      <small>{format(new Date(settlement.date), "MMM dd, yyyy")}</small>
    </div>
  );
}