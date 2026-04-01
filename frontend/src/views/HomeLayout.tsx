import { Outlet } from "react-router-dom";
import { TopNav } from "../components";

export default function HomeLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
