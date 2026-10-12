import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@/lib/preview-bridge";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { ThemeProvider } from "@/lib/theme";
import App from "./App";
import "./index.css";

// Platform-owned entry — provider stack lives here. Nest additional
// providers INSIDE AuthSessionProvider; do not remove it.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthSessionProvider>
          <App />
        </AuthSessionProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
