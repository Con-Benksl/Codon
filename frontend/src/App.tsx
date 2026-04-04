import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { DnaParticles } from "./components";
import { getSceneForPath } from "./lib/dna-scenes";
import { useAuth } from "./auth/context";
import HomeLayout from "./views/HomeLayout";
import AppLayout from "./views/AppLayout";
import HomeView from "./views/HomeView";
import LoginView from "./views/LoginView";
import ProjectsView from "./views/ProjectsView";
import DesignerView from "./views/DesignerView";
import ChatView from "./views/ChatView";
import AnalysisView from "./views/AnalysisView";

const LOGIN_PATH = "/login";

function AuthCheckingView() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted text-sm">
      Loading...
    </div>
  );
}

function getCurrentPath(location: { pathname: string; search: string; hash: string }) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function RequireAuth() {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();
  if (status === "loading") return <AuthCheckingView />;
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(getCurrentPath(location));
    return <Navigate to={`${LOGIN_PATH}?redirect=${redirect}`} replace />;
  }
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { status, isAuthenticated } = useAuth();
  if (status === "loading") return <AuthCheckingView />;
  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }
  return <Outlet />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const dnaParams = useMemo(() => getSceneForPath(location.pathname), [location.pathname]);

  return (
    <>
      <DnaParticles params={dnaParams} particleCount={5000} />

      <Routes location={location}>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginView />} />
        </Route>

        <Route element={<HomeLayout />}>
          <Route index element={<HomeView />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="projects" element={<ProjectsView />} />
            <Route path="designer" element={<DesignerView />} />
            <Route path="chat" element={<ChatView />} />
            <Route path="analysis" element={<AnalysisView />} />
          </Route>
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

