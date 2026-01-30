import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 mins
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 mins

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

const activityEvents = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

const logoutUser = (navigate) => {
  localStorage.removeItem("userData");
  localStorage.removeItem("token");
  localStorage.removeItem("expirationTime");
  toast.info("Session expired due to inactivity");
  navigate("/login", { replace: true });
};

const useSessionManager = () => {
  const navigate = useNavigate();
  const idleTimer = useRef(null);
  const refreshTimer = useRef(null);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);

    idleTimer.current = setTimeout(() => {
      logoutUser(navigate);
    }, IDLE_TIMEOUT);
  };

  const refreshToken = async () => {
    try {
      const token = await getAccessToken();
      localStorage.setItem(
        "userData",
        JSON.stringify({
          token: token,
          expirationTime: Date.now() + 60 * 60 * 1000, // 1 hour
        }),
      );
      localStorage.setItem("token", token);
      localStorage.setItem(
        "expirationTime",
        Date.now() + TOKEN_REFRESH_INTERVAL,
      );

      console.log("🔄 Token refreshed");
    } catch (err) {
      console.error("Token refresh failed", err);
      logoutUser(navigate);
    }
  };

  useEffect(() => {
    // Initial checks
    if (!localStorage.getItem("userData")) {
      logoutUser(navigate);
      return;
    }

    resetIdleTimer();
    refreshToken();

    refreshTimer.current = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);

    activityEvents.forEach((event) =>
      window.addEventListener(event, resetIdleTimer),
    );

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (refreshTimer.current) clearInterval(refreshTimer.current);

      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer),
      );
    };
  }, []);
};

export default useSessionManager;
