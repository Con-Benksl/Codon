import { Outlet } from "react-router-dom";
import { Sidebar } from "../components";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 relative z-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
