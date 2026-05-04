import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Fragment, Suspense, lazy } from "react";
import { AnimatePresence, motion } from "motion/react";
import ErrorBoundary from "./ErrorBoundary";
import { DnaParticles } from "./components";
import { globalDnaScene } from "./lib/dna-scenes";
import { useAuth } from "./auth/context";
import HomeLayout from "./views/HomeLayout";
import AppLayout from "./views/AppLayout";

// Lazy loaded views for code splitting
const HomeView = lazy(() => import("./views/HomeView"));
const LoginView = lazy(() => import("./views/LoginView"));
const ProjectsView = lazy(() => import("./views/ProjectsView"));
const DesignerView = lazy(() => import("./views/DesignerView"));
const ChatView = lazy(() => import("./views/ChatView"));
const AnalysisView = lazy(() => import("./views/AnalysisView"));

function RouteLoadingFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-bg/50 backdrop-blur-sm">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <div className="text-primary text-xs font-medium tracking-widest opacity-80 uppercase">Loading Data...</div>
      </motion.div>
    </div>
  );
}

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

  return (
    <>
      <DnaParticles params={globalDnaScene} particleCount={5000} />

      <AnimatePresence mode="wait">
        <Fragment key={location.pathname}>
          <Routes location={location}>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <LoginView />
                </Suspense>
              } />
            </Route>

            <Route element={<HomeLayout />}>
              <Route index element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <HomeView />
                </Suspense>
              } />
            </Route>

            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="projects" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <ProjectsView />
                  </Suspense>
                } />
                <Route path="projects/:projectId/designer" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <DesignerView />
                  </Suspense>
                } />
                <Route path="projects/:projectId/designs/:designId/designer" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <DesignerView />
                  </Suspense>
                } />
                <Route path="designer" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <DesignerView />
                  </Suspense>
                } />
                <Route path="chat" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <ChatView />
                  </Suspense>
                } />
                <Route path="analysis" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <AnalysisView />
                  </Suspense>
                } />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Fragment>
      </AnimatePresence>
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
