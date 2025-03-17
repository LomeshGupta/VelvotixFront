import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
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
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import { DashboardLayout, ThemeSwitcher } from "@toolpad/core/DashboardLayout";
import CloudCircleIcon from "@mui/icons-material/CloudCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Chip from "@mui/material/Chip";
import ToolbarActionsSearch from "./ToolbarActionsSearch";
import { toast } from "react-toastify";
import logo from "../Assets/logo-upscae.png";

import Home from "../Pages/Home";

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
        : `© ${new Date().getFullYear()} Made with love by CodexSpell`}
    </Typography>
  );
}

SidebarFooter.propTypes = {
  mini: PropTypes.bool.isRequired,
};

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
    segment: "orders",
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

function DemoPageContent({ pathname, children }) {
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
      <Typography>Dashboard content for {pathname}</Typography>
      {children} {/* Render the children passed via the route */}
    </Box>
  );
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
  children: PropTypes.node, // Accept children as a prop
};

function DashboardLayoutAccount({ window, children }) {
  const userData = JSON.parse(localStorage.getItem("userData"));
  const [session, setSession] = React.useState({
    user: {
      name: userData.Full_Name,
      email: userData.Email,
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

        navigate("/login"); // Navigate to login on sign out
        toast.success("Logout successful!");
      },
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated
    const userData = localStorage.getItem("userData");
    if (userData && !isTokenExpired()) {
      setIsAuthenticated(true);
    } else {
      clearUserData(); // Clear user data if token is expired
      setIsAuthenticated(false); // User is not authenticated
      navigate("/login"); // Redirect to login page
    }
  }, [navigate]);

  const demoWindow = window !== undefined ? window() : undefined;

  return (
    <AppProvider
      session={session}
      branding={{
        logo: <img src={logo} alt="CodexSpell logo" />,
        title: "CodeXSpell",
        homeUrl: "/",
      }}
      authentication={authentication}
      navigation={NAVIGATION}
      theme={demoTheme}
      window={demoWindow}
    >
      <DashboardLayout
        slots={{
          toolbarActions: ToolbarActionsSearch,
          sidebarFooter: SidebarFooter,
        }}
      >
        {children}
      </DashboardLayout>
    </AppProvider>
  );
}

DashboardLayoutAccount.propTypes = {
  window: PropTypes.func,
  children: PropTypes.node, // Make sure to allow children to be passed in
};

export default DashboardLayoutAccount;
