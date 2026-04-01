import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useMemo } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { DnaParticles } from "./components";
import { getSceneForPath } from "./lib/dna-scenes";
import HomeLayout from "./views/HomeLayout";
import AppLayout from "./views/AppLayout";
import HomeView from "./views/HomeView";
import LoginView from "./views/LoginView";
import ProjectsView from "./views/ProjectsView";
import DesignerView from "./views/DesignerView";
import ChatView from "./views/ChatView";
import AnalysisView from "./views/AnalysisView";

function AnimatedRoutes() {
  const location = useLocation();
  const dnaParams = useMemo(() => getSceneForPath(location.pathname), [location.pathname]);

  return (
    <>
      {/* Global DNA particles — single instance, smoothly interpolates on route change */}
      <DnaParticles params={dnaParams} particleCount={5000} />

      <Routes location={location}>
        <Route path="/login" element={<LoginView />} />

        {/* Home — top nav, fullscreen immersive */}
        <Route element={<HomeLayout />}>
          <Route index element={<HomeView />} />
        </Route>

        {/* App — sidebar layout */}
        <Route element={<AppLayout />}>
          <Route path="projects" element={<ProjectsView />} />
          <Route path="designer" element={<DesignerView />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="analysis" element={<AnalysisView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
