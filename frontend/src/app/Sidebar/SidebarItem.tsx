import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

interface Props {
  icon: LucideIcon;
  label: string;
  path: string;
}

export default function SidebarItem({
  icon: Icon,
  label,
  path,
}: Props) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `nav-item ${isActive ? "active" : ""}`
      }
    >
      <Icon size={20} />

      <span>{label}</span>
    </NavLink>
  );
}