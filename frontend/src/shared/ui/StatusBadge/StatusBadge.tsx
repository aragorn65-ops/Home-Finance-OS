import Badge from "../Badge";

export type Status =
  | "Approved"
  | "Archived"
  | "Draft"
  | "Pending"
  | "Rejected"
  | "Paid"
  | "Unpaid"
  | "Overdue"
  | "Active"
  | "Inactive";

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  switch (status) {
    case "Approved":
    case "Paid":
    case "Active":
      return (
        <Badge variant="success">
          {status}
        </Badge>
      );

    case "Pending":
    case "Draft":
      return (
        <Badge variant="warning">
          {status}
        </Badge>
      );

    case "Rejected":
    case "Overdue":
    case "Unpaid":
      return (
        <Badge variant="danger">
          {status}
        </Badge>
      );

    case "Inactive":
    case "Archived":
      return (
        <Badge variant="neutral">
          {status}
        </Badge>
      );

    default:
      return (
        <Badge variant="info">
          {status}
        </Badge>
      );
  }
}