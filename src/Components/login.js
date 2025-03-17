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
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData || !userData.expirationTime) return true;
  return new Date().getTime() > userData.expirationTime;
};

// Function to clear the user data when token is expired
const clearUserData = () => {
  localStorage.removeItem('userData');
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const url = `http://localhost:7048/BC250/ODataV4/Company('CRONUS%20UK%20Ltd.')/Codexspell_users?$filter=User_Name eq '${username}'`;
    const credentials = `Lomesh:Bittu@1998`;
    const base64Credentials = btoa(credentials);
  
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${base64Credentials}`,
        },
        withCredentials: true,
      });
  
      const user = response.data.value[0];
      const base64Password = user.Password;
      const decodedPassword = atob(base64Password);
  
      if (decodedPassword === password) {
        // Get the current system location and device
        const location = await getLocation();
        const device = getDeviceInfo();
  
        // Prepare log data
        const logData = {
          User_Name: username,
          Time: new Date().toISOString(), // Current time in ISO format
          Location: location,
          Device: device,
          Type: 'Login',
          Success: true,
        };
  
        // Post the login log to the server
        await axios.post(
          `http://localhost:7048/BC250/ODataV4/Company('CRONUS%20UK%20Ltd.')/Codexspell_loginlogs`,
          logData,
          {
            headers: {
              'Authorization': `Basic ${base64Credentials}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }
        );
  
        // Store user data and token in localStorage
        const userData = {
          ...user, // Store all user details
          token: base64Credentials, // Store the token (You might want to change this if it's a JWT token or similar)
          expirationTime: new Date().getTime() + 3600000, // Token expiration time (1 hour from now)
        };
  
        localStorage.setItem('userData', JSON.stringify(userData));
  
        // Debugging: Check if navigate is being called
        console.log('Navigating to home...');
  
        // Navigate to the home page
        navigate("/");
  
        // Show success toast
        toast.success("Login successful!");
      } else {
        toast.error("Invalid username or password.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
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
          }
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
      const userData = localStorage.getItem('userData');
      if (userData && !isTokenExpired()) {
        navigate('/');
      } else {
        clearUserData(); // Clear user data if token is expired
        setIsAuthenticated(false); // User is not authenticated
        navigate('/login')
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
