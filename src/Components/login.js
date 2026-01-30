import React, { useState, useEffect } from "react";
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isTokenExpired = () => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData?.expirationTime) return true;
    return Date.now() > userData.expirationTime;
  };

  const getAccessToken = async () => {
    const tokenUrl = "https://velvotixbackend.onrender.com/api/bc/token";

    const body = {
      tokenUrl: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID}/oauth2/v2.0/token`,
      clientId: process.env.REACT_APP_CLIENT_ID,
      clientSecret: process.env.REACT_APP_CLIENT_SECRET,
      scope: "https://api.businesscentral.dynamics.com/.default",
    };

    const response = await axios.post(tokenUrl, body);
    return response.data.accessToken;
  };

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
        headers: { Authorization: `Bearer ${accessToken}` },
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
          expirationTime: Date.now() + 60 * 60 * 1000, // 1 hour
        }),
      );

      navigate("/");
      toast.success("Login successful!");
    } catch (err) {
      console.error(err);
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve("Location not available");
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`${pos.coords.latitude}, ${pos.coords.longitude}`),
        () => resolve("Location not available"),
      );
    });

  const getDeviceInfo = () => navigator.userAgent;

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData && !isTokenExpired()) {
      navigate("/");
    } else {
      clearUserData();
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
          mt: 8,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Login to Your Account
        </Typography>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <TextField
            label="Password"
            fullWidth
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
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
