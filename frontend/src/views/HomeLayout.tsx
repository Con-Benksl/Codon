import { Outlet } from "react-router-dom";
import { TopNav, DnaParticles } from "../components";

export default function HomeLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <DnaParticles opacity={1.0} particleCount={5000} />
      <TopNav />
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
