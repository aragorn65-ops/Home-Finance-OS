import "./Sidebar.css";

import SidebarBrand from "./SidebarBrand";
import SidebarNav from "./SidebarNav";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  isOpen = false,
  onClose,
}: SidebarProps) {
  const sidebarClasses = [
    "sidebar",
    isOpen ? "sidebar--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const backdropClasses = [
    "sidebar-backdrop",
    isOpen ? "sidebar-backdrop--visible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <aside
        id="app-sidebar"
        className={sidebarClasses}
        aria-label="Primary navigation"
      >
        <SidebarBrand />

        <SidebarNav onNavigate={onClose} />
      </aside>

      <button
        type="button"
        className={backdropClasses}
        aria-label="Close navigation"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />
    </>
  );
}
