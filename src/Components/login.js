import React, { use, useState, useEffect } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to check if token has expired
  const isTokenExpired = () => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || !userData.expirationTime) return true;
    return new Date().getTime() > userData.expirationTime;
  };

  const getAccessToken = async () => {
    const tokenUrl = "https://velvotixbackend.onrender.com/api/bc/token";

    const tenantId = process.env.REACT_APP_TENANT_ID;
    const clientId = process.env.REACT_APP_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_CLIENT_SECRET;

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const body = {
      tokenUrl: url,
      clientId: process.env.REACT_APP_CLIENT_ID,
      clientSecret: process.env.REACT_APP_CLIENT_SECRET,
      scope: "https://api.businesscentral.dynamics.com/.default",
    };

    const response = await axios.post(tokenUrl, body);
    // console.log(response.data.accessToken);
    return response.data.accessToken;
  };

  // Function to clear the user data when token is expired
  const clearUserData = () => {
    localStorage.removeItem("userData");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = await getAccessToken();
      const tenant = process.env.REACT_APP_TENANT_ID;
      const baseUrl = process.env.REACT_APP_BC_BASE_URL;
      const environment = process.env.REACT_APP_BC_ENVIRONMENT;
      const company = process.env.REACT_APP_BC_COMPANY;

      const url = `${baseUrl}/v2.0/${tenant}/${environment}/ODataV4/Company('${company}')/Codexspell_users?$filter=User_Name eq '${username}'`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const user = response.data.value?.[0];
      if (!user) {
        toast.error("Invalid username or password");
        return;
      }

      const decodedPassword = atob(user.Password);

      if (decodedPassword !== password) {
        toast.error("Invalid username or password");
        return;
      }

      // Get system info
      const location = await getLocation();
      const device = getDeviceInfo();

      const logData = {
        User_Name: username,
        Time: new Date().toISOString(),
        Location: location,
        Device: device,
        Type: "Login",
        Success: true,
      };

      await axios.post(
        `${baseUrl}/v2.0/${environment}/ODataV4/Company('${company}')/Codexspell_loginlogs`,
        logData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      localStorage.setItem(
        "userData",
        JSON.stringify({
          ...user,
          token: accessToken,
          expirationTime: Date.now() + 3600000,
        }),
      );

      navigate("/");
      toast.success("Login successful!");
    } catch (error) {
      console.error(error);
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Function to get the current location using Geolocation API
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = `${position.coords.latitude}, ${position.coords.longitude}`;
            resolve(location); // Return latitude and longitude as a string
          },
          (error) => {
            console.error("Error getting location:", error);
            resolve("Location not available"); // Fallback if geolocation fails
          },
        );
      } else {
        resolve("Geolocation not supported"); // Fallback if geolocation is not supported
      }
    });
  };

  // Function to get device info (user-agent)
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    // Optionally, you can use a library to parse the user agent and get more details (e.g., 'platform', 'device type')
    return userAgent;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated
    const userData = localStorage.getItem("userData");
    if (userData && !isTokenExpired()) {
      navigate("/");
    } else {
      clearUserData(); // Clear user data if token is expired
      setIsAuthenticated(false);
      navigate("/login");
    }
  }, []);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Login to Your Account
        </Typography>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: 2 }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login;
