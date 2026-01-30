import React, { useEffect, useState } from "react";
import PropTypes, { element } from "prop-types";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom"; // Using react-router-dom for navigation
import Typography from "@mui/material/Typography";
import { createTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BarChartIcon from "@mui/icons-material/BarChart";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";
import { AppProvider } from "@toolpad/core/AppProvider";
import SalesOrdersList from "../Pages/SalesOrdersList";
import useSessionManager from "./useSessionManager";

import { DashboardLayout, ThemeSwitcher } from "@toolpad/core/DashboardLayout";
import Chip from "@mui/material/Chip";
import ToolbarActionsSearch from "./ToolbarActionsSearch";
import { toast } from "react-toastify";
import logo from "../Assets/logo-upscae.png";
import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { DemoProvider, useDemoRouter } from "@toolpad/core/internal";

// Function to check if token has expired
const isTokenExpired = () => {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData || !userData.expirationTime) return true;
  return new Date().getTime() > userData.expirationTime;
};

// Function to clear the user data when token is expired
const clearUserData = () => {
  localStorage.removeItem("userData");
};

function SidebarFooter({ mini }) {
  return (
    <Typography
      variant="caption"
      sx={{ m: 1, whiteSpace: "nowrap", overflow: "hidden" }}
    >
      {mini
        ? "©"
        : `© ${new Date().getFullYear()} Made with love by Velvotix`}
    </Typography>
  );
}

SidebarFooter.propTypes = {
  mini: PropTypes.bool.isRequired,
};

const Router = [
  {
    pathname: "/sales-orders",
    navigate: <SalesOrdersList />,
  },
];

const NAVIGATION = [
  {
    kind: "header",
    title: "Main items",
  },
  {
    segment: "",
    title: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    segment: "sales-orders",
    title: "Orders",
    icon: <ShoppingCartIcon />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Analytics",
  },
  {
    segment: "reports",
    title: "Reports",
    icon: <BarChartIcon />,
    children: [
      {
        segment: "sales",
        title: "Sales",
        icon: <DescriptionIcon />,
      },
      {
        segment: "traffic",
        title: "Traffic",
        icon: <DescriptionIcon />,
      },
    ],
  },
  {
    segment: "integrations",
    title: "Integrations",
    icon: <LayersIcon />,
  },
];

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: { light: true, dark: true },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

function DemoPageContent() {
  const location = useLocation();

  return (
    <Box
      sx={{
        py: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Typography>Dashboard content for {location.pathname}</Typography>
    </Box>
  );
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
};

function DashboardLayoutAccount({ window, children }) {
  useSessionManager();
  const userDataString = localStorage.getItem("userData");
  const userData = userDataString ? JSON.parse(userDataString) : {};
  const router = useDemoRouter("/page");
  console.log(router);

  const [session, setSession] = React.useState({
    user: {
      name: userData.Full_Name || "",
      email: userData.Email || "",
    },
  });

  const navigate = useNavigate(); // Using react-router's useNavigate hook

  const handleClick = (path) => {
    navigate(path); // Navigate to the specified path
  };

  const authentication = React.useMemo(() => {
    return {
      signOut: () => {
        localStorage.removeItem("userData");
        localStorage.removeItem("token");
        localStorage.removeItem("expirationTime");

        navigate("/login");
        toast.success("Logout successful!");
      },
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");

    // Parse userData safely
    const userData = userDataString ? JSON.parse(userDataString) : null;

    if (!userData) {
      clearUserData();
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  const demoWindow = window !== undefined ? window() : undefined;

  const routers = useDemoRouter("/");

  return (
    <AppProvider
      session={session}
      branding={{
        logo: <img src={logo} alt="Velvotix logo" />,
        title: "Velvotix",
        homeUrl: "/",
      }}
      authentication={authentication}
      navigation={NAVIGATION}
      // router={routers}
      theme={demoTheme}
      window={demoWindow}
    >
      <DashboardLayout
        slots={{
          toolbarActions: ToolbarActionsSearch,
          sidebarFooter: SidebarFooter,
        }}
      >
        <Outlet />
        {/* <handleClick path={routers.pathname} /> */}
      </DashboardLayout>
    </AppProvider>
  );
}

DashboardLayoutAccount.propTypes = {
  window: PropTypes.func,
  children: PropTypes.node, // Make sure to allow children to be passed in
};

export default DashboardLayoutAccount;
