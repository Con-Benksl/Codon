import { Outlet } from "react-router-dom";
import { Sidebar, DnaParticles } from "../components";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <DnaParticles opacity={0.5} particleCount={2500} />
      <Sidebar />
      <main className="flex-1 relative z-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
