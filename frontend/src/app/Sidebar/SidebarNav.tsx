import SidebarItem from "./SidebarItem";
import { navigation } from "./navigation";

interface SidebarNavProps {
  onNavigate?: () => void;
}

export default function SidebarNav({
  onNavigate,
}: SidebarNavProps) {
  return (
    <nav className="sidebar-nav">
      {navigation.map((group, index) => (
        <div key={group.section}>
          <p className="nav-section">
            {group.section}
          </p>

          {group.items.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              path={item.path}
              onNavigate={onNavigate}
            />
          ))}

          {index < navigation.length - 1 && (
            <div className="divider" />
          )}
        </div>
      ))}
    </nav>
  );
}
