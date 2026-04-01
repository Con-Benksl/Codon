import { Outlet } from "react-router-dom";
import { TopNav, DnaParticles } from "../components";

export default function HomeLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <DnaParticles opacity={0.7} particleCount={3000} />
      <TopNav />
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
