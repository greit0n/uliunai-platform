import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import StatsPage from "../pages/stats/page";
import TermsOfService from "../pages/TermsOfService";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/stats",
    element: <StatsPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/terms",
    element: <TermsOfService />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
