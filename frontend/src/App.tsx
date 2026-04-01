import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import HomeLayout from "./views/HomeLayout";
import AppLayout from "./views/AppLayout";
import HomeView from "./views/HomeView";
import LoginView from "./views/LoginView";
import ProjectsView from "./views/ProjectsView";
import DesignerView from "./views/DesignerView";
import ChatView from "./views/ChatView";
import AnalysisView from "./views/AnalysisView";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
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
      </BrowserRouter>
    </ErrorBoundary>
  );
}
