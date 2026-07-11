import SidebarItem from "./SidebarItem";
import { navigation } from "./navigation";

export default function SidebarNav() {
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