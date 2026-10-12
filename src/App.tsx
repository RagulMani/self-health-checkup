import { useEffect } from "react";
import { useLocation, useRoutes } from "react-router-dom";
import { reportRoute } from "@/lib/preview-bridge";
import { routes } from "./routes";

// Platform shell: renders the registry in src/routes.tsx and reports route
// changes to the workbench preview. Add screens to routes.tsx, not here.
export default function App() {
  const location = useLocation();
  useEffect(() => {
    reportRoute(location.pathname);
  }, [location.pathname]);
  return useRoutes(routes);
}
