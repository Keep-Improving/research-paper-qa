import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Sidebar } from "./Sidebar";
import { captureActiveTabSelection } from "./sidebarClient";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sidebar onUseSelection={captureActiveTabSelection} />
  </StrictMode>
);
