import "./Sidebar.css";

import SidebarBrand from "./SidebarBrand";
import SidebarNav from "./SidebarNav";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <SidebarBrand />
      <SidebarNav />
    </aside>
  );
}