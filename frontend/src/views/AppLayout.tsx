import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar, AnimatedOutlet } from "../components";
import { setScrollProgress } from "../lib/scroll-progress";

export default function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setScrollProgress(max > 0 ? el.scrollTop / max : 0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setScrollProgress(0);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main ref={mainRef} className="flex-1 relative z-10 overflow-y-auto">
        <AnimatedOutlet />
      </main>
    </div>
  );
}
