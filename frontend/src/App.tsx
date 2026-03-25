/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./views/Layout";
import LoginView from "./views/LoginView";
import ProjectsView from "./views/ProjectsView";
import SettingsView from "./views/SettingsView";
import DynamicProjectView from "./views/DynamicProjectView";
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
          <Route path="orchestrator" element={<DynamicProjectView viewKey="orchestrator" />} />
          <Route path="environment" element={<DynamicProjectView viewKey="environment" />} />
          <Route path="synthesis" element={<DynamicProjectView viewKey="synthesis" />} />
          <Route path="simulation" element={<DynamicProjectView viewKey="simulation" />} />
          <Route path="output" element={<DynamicProjectView viewKey="output" />} />
          <Route path="/diagnostics" element={<DynamicProjectView viewKey="diagnostics" />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/orchestrator" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
