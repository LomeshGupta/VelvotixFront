import { createBrowserRouter } from "react-router-dom";
import DashboardLayoutAccount from "./AdminPanel";
import Home from "../Pages/Home";
import SalesOrdersList from "../Pages/SalesOrdersList";
import Login from "./login";
import { createRouter } from "@toolpad/core/router/react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayoutAccount />,
    children: [
      { index: true, element: <Home /> },
      { path: "sales-orders", element: <SalesOrdersList /> },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

export default router;
