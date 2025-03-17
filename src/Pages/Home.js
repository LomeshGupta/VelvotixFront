import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { BarChart, Bar } from "recharts";

const Dashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      const url = `http://localhost:7048/BC250/ODataV4/Company('CRONUS%20UK%20Ltd.')/dashboard_sales?$top=10`;
      const credentials = `Lomesh:Bittu@1998`;
      const base64Credentials = btoa(credentials);
      
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Basic ${base64Credentials}`,
          },
          withCredentials: true,
        });
        setSalesData(response.data.value);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    };
   
    fetchSalesData();
    const interval = setInterval(fetchSalesData, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <Box sx={{ p: 5 }}>
      {/* Welcome Section */}
      <Card
        sx={{
          mb: 3,
          p: 5,
          textAlign: "left",
          backgroundColor: "#1976d2",
          color: "white",
        }}
      >
        <Typography variant="h5">Welcome to CodexSpell</Typography>
        <Typography variant="body1" sx={{ my: 1 }}>
          Manage your product analytics & track real-time performance.
        </Typography>
        <Button variant="contained" color="secondary">
          View Full Statistics
        </Button>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={2}>
        {[
          { title: "Total Visits", value: "70,250", icon: <TrendingUpIcon /> },
          { title: "Total Sales", value: "$15,670", icon: <TrendingUpIcon /> },
          { title: "Revenue", value: "$32,075", icon: <TrendingUpIcon /> },
        ].map((metric, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card sx={{ p: 2, display: "flex", alignItems: "center" }}>
              {metric.icon}
              <Box sx={{ ml: 2 }}>
                <Typography variant="h6">{metric.title}</Typography>
                <Typography variant="h4">{metric.value}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Graphical Data */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Sales Overview</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={{
                  
                }}>
                  <XAxis dataKey="Month" />
                  <YAxis />
                  <Tooltip />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="Sales" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Sales Reports</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <XAxis dataKey="Month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Sales" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6">Recent Orders</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Product Name & ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Quantity Shipped</TableCell>
                <TableCell>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesData.map((order, index) => (
                <TableRow key={index}>
                  <TableCell>{order.DocumentNo_}</TableCell>
                  <TableCell>{order.No_}</TableCell>
                  <TableCell>{order.Status}</TableCell>
                  <TableCell>{order.Quantity}</TableCell>
                  <TableCell>{order.QuantityShipped}</TableCell>
                  <TableCell>{order.Amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
