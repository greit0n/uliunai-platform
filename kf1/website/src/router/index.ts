import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { useEffect } from "react";
import routes from "./config";

/**
 * Resolver function for the navigate promise.
 * 
 * @type {(navigate: ReturnType<typeof useNavigate>) => void}
 */
let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

/**
 * Global window interface extension for navigation.
 * 
 * @description Extends the Window interface to include a navigation function
 * that can be accessed globally for programmatic navigation.
 */
declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

/**
 * Promise that resolves when navigation is available.
 * 
 * @description Provides a way to access the navigation function before
 * the router is fully initialized. Used for programmatic navigation from
 * outside React components.
 * 
 * @type {Promise<NavigateFunction>}
 */
export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

/**
 * AppRoutes component that renders the application routes.
 * 
 * @description Uses React Router's useRoutes hook to render routes based on
 * the current location. Also sets up global navigation access by storing the
 * navigate function on the window object and resolving the navigatePromise.
 * 
 * @returns {JSX.Element | null} The matched route element or null
 */
export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    navigateResolver(window.REACT_APP_NAVIGATE);
  });
  return element;
}
