import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App, applyTheme } from "./App";
import { setupPwa } from "./lib/pwa";

applyTheme();
setupPwa();
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
