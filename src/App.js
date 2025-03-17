import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify"; // Import ToastContainer
import Login from "./Components/login";
import Home from "./Pages/Home";
import DashboardLayout from "./Components/AdminPanel"; // Import DashboardLayout
import { createTheme } from "@mui/material/styles";
import { AppProvider } from "@toolpad/core";
import "./App.css";

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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated
    const userData = localStorage.getItem("userData");
    if (userData && !isTokenExpired()) {
      setIsAuthenticated(true);
    } else {
      clearUserData(); // Clear user data if token is expired
      setIsAuthenticated(false); // User is not authenticated
    }
  }, []);

  return (
    <AppProvider theme={demoTheme}>
      <Router>
        <Routes>
          {/* Redirect to /home if user is authenticated and tries to go to /login */}
          <Route path="/login" element={<Login />} />

          {/* Wrap authenticated routes in DashboardLayout */}
          <Route
            path="/"
            element={
              <DashboardLayout>
                <Home />
              </DashboardLayout>
            }
          />
           <Route
            path="/orders"
            element={
              <DashboardLayout>
                <Home />
              </DashboardLayout>
            }
          />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={1000}
          hideProgressBar={false}
          newestOnTop={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </Router>
    </AppProvider>
  );
}

export default App;
