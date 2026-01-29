import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./Components/login";
import Home from "./Pages/Home";
import SalesOrdersList from "./Pages/SalesOrdersList";
import DashboardLayout from "./Components/AdminPanel";
import { createTheme } from "@mui/material/styles";
import { AppProvider } from "@toolpad/core";
import "./App.css";

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: { light: true, dark: true },
});

function App() {
  return (
    <AppProvider theme={demoTheme}>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected Layout */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="/sales-orders" element={<SalesOrdersList />} />
          </Route>
        </Routes>

        <ToastContainer position="top-right" autoClose={1000} theme="colored" />
      </Router>
    </AppProvider>
  );
}

export default App;
