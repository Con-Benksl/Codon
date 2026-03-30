/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./views/Layout";
import LoginView from "./views/LoginView";
import ProjectsView from "./views/ProjectsView";
import OrchestratorView from "./views/OrchestratorView";
import CommandView from "./views/CommandView";
import EnvironmentView from "./views/EnvironmentView";
import SynthesisView from "./views/SynthesisView";
import ErrorBoundary from "./ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/orchestrator" replace />} />
          <Route path="projects" element={<ProjectsView />} />
          <Route path="orchestrator" element={<OrchestratorView />} />
          <Route path="command" element={<CommandView />} />
          <Route path="environment" element={<EnvironmentView />} />
          <Route path="synthesis" element={<SynthesisView />} />
          <Route path="*" element={<Navigate to="/orchestrator" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
