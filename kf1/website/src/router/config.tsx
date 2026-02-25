import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";

/**
 * Application route configuration.
 * 
 * @description Defines all routes for the application including the home page
 * and 404 catch-all route. Routes are configured using React Router's RouteObject type.
 * 
 * @type {RouteObject[]}
 */
const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
