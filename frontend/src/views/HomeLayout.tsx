import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TopNav, AnimatedOutlet } from "../components";
import { setScrollProgress } from "../lib/scroll-progress";

export default function HomeLayout() {
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setScrollProgress(0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <main className="relative z-10">
        <AnimatedOutlet />
      </main>
    </div>
  );
}
