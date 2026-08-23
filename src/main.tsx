import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource-variable/dm-sans";
import "@esri/calcite-components/main.css";
import "./setupCalcite";
import "./theme.css";
import { App } from "./App";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
