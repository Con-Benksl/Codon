/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./views/Layout";
import OrchestratorView from "./views/OrchestratorView";
import EnvironmentView from "./views/EnvironmentView";
import SynthesisView from "./views/SynthesisView";
import SimulationView from "./views/SimulationView";
import OutputView from "./views/OutputView";
import LoginView from "./views/LoginView";
import ProjectsView from "./views/ProjectsView";

export default function App() {
  return (
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
  );
}
