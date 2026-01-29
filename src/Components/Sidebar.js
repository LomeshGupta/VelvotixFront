import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BarChartIcon from "@mui/icons-material/BarChart";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Orders", path: "/sales-orders", icon: <ShoppingCartIcon /> },
  {
    label: "Reports",
    icon: <BarChartIcon />,
    children: [
      { label: "Sales", path: "/reports/sales" },
      { label: "Traffic", path: "/reports/traffic" },
    ],
  },
  { label: "Integrations", path: "/integrations", icon: <LayersIcon /> },
];

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(true);

  return (
    <Drawer variant="permanent" sx={{ width: 260 }}>
      <List sx={{ width: 260 }}>
        {navItems.map((item) =>
          item.children ? (
            <div key={item.label}>
              <ListItemButton onClick={() => setOpen(!open)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
                {open ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              <Collapse in={open}>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.path}
                      component={NavLink}
                      to={child.path}
                      selected={location.pathname === child.path}
                      sx={{ pl: 4 }}
                    >
                      <ListItemText primary={child.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </div>
          ) : (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ),
        )}
      </List>
    </Drawer>
  );
}
