import { useRef } from "react";
import { Sidebar, AnimatedOutlet } from "../components";

export default function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main ref={mainRef} className="flex-1 relative z-10 overflow-y-auto">
        <AnimatedOutlet />
      </main>
    </div>
  );
}
