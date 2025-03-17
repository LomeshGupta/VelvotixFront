import React, { useState } from "react";
import {
  Stack,
  Tooltip,
  IconButton,
  TextField,
  Menu,
  MenuItem,
  Typography,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { ThemeSwitcher } from "@toolpad/core/DashboardLayout";
import { useNavigate } from "react-router-dom";

const routes = [
  { path: "/login", name: "Login" },
  { path: "/", name: "Home" },
  { path: "/orders", name: "Orders" },
  { path: "/profile", name: "Profile" },
  { path: "/settings", name: "Settings" },
];

function ToolbarActionsSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (value.trim() !== "") {
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
    }
  };

  const handleSelect = (path) => {
    navigate(path);
    setSearchTerm("");
    setAnchorEl(null);
  };

  const filteredResults = searchTerm
    ? routes.filter((route) =>
        new RegExp(searchTerm, "i").test(route.name)
      )
    : [];

  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="Search" enterDelay={1000}>
        <div>
          <IconButton
            type="button"
            aria-label="search"
            sx={{ display: { xs: "inline", md: "none" } }}
          >
            <SearchIcon />
          </IconButton>
        </div>
      </Tooltip>
      <div style={{ position: "relative" }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            display: { xs: "none", md: "inline-block" },
            mr: 1,
            width: "200px",
          }}
        />
        {filteredResults.length > 0 && (
          <Paper
            elevation={3}
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 10,
              borderRadius: 1,
              mt: 0.5,
            }}
          >
            {filteredResults.map((route) => (
              <MenuItem key={route.path} onClick={() => handleSelect(route.path)}>
                {route.name}
              </MenuItem>
            ))}
          </Paper>
        )}
      </div>
      <ThemeSwitcher />
    </Stack>
  );
}

export default ToolbarActionsSearch;
