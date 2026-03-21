/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./views/Layout";
import OrchestratorView from "./views/OrchestratorView";
import EnvironmentView from "./views/EnvironmentView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/orchestrator" replace />} />
          <Route path="orchestrator" element={<OrchestratorView />} />
          <Route path="environment" element={<EnvironmentView />} />
          {/* Future routes */}
          {/* <Route path="design" element={<DesignView />} /> */}
          {/* <Route path="verify" element={<VerifyView />} /> */}
          <Route path="*" element={<Navigate to="/orchestrator" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
