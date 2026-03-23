/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Component, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./views/Layout";
import OrchestratorView from "./views/OrchestratorView";
import EnvironmentView from "./views/EnvironmentView";
import SynthesisView from "./views/SynthesisView";
import SimulationView from "./views/SimulationView";
import OutputView from "./views/OutputView";
import LoginView from "./views/LoginView";
import ProjectsView from "./views/ProjectsView";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant font-body text-sm">
          页面出现错误，请{" "}
          <button onClick={() => window.location.reload()} className="text-primary underline ml-1">刷新重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
          <Route path="environment" element={<EnvironmentView />} />
          <Route path="synthesis" element={<SynthesisView />} />
          <Route path="simulation" element={<SimulationView />} />
          <Route path="output" element={<OutputView />} />
          <Route path="*" element={<Navigate to="/orchestrator" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
