import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  onNavigate?: () => void;
}

export default function SidebarItem({
  icon: Icon,
  label,
  path,
  onNavigate,
}: SidebarItemProps) {
  return (
    <NavLink
      to={path}
      end={path === "/app"}
      className={({ isActive }) =>
        [
          "nav-item",
          isActive ? "active" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
      onClick={onNavigate}
    >
      <Icon
        size={20}
        aria-hidden="true"
      />

      <span>{label}</span>
    </NavLink>
  );
}
