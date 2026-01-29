import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Card,
  CardContent,
  Link,
  IconButton,
  Button,
  Select,
  MenuItem,
  Tooltip,
  Fab,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import SalesOrderDialog from "../Components/SalesOrderDialog";

/* ================= CONFIG ================= */

const PAGE_SIZE = 20;

const FIELD_TYPES = {
  no: "text",
  sellToCustomerNo: "text",
  postingDate: "date",
  amount: "number",
  amountIncludingVAT: "number",
};

const FIELDS = [
  { id: "no", label: "Order No" },
  { id: "sellToCustomerNo", label: "Customer No" },
  { id: "postingDate", label: "Posting Date" },
  { id: "amount", label: "Amount" },
  { id: "amountIncludingVAT", label: "Amount Incl. VAT" },
];

/* ================= HELPERS ================= */

const escapeOData = (v) => v.replace(/'/g, "''");
const isISODate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/* ================= COMPONENT ================= */

export default function SalesOrdersList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("no");

  const [filterPaneOpen, setFilterPaneOpen] = useState(false);
  const [addingFilter, setAddingFilter] = useState(false);

  const [draftFilters, setDraftFilters] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState([]);

  /* EDIT DIALOG */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const lastRowRef = useRef(null);

  /* ================= RESET ================= */

  const resetList = () => {
    setRows([]);
    setPage(0);
    setHasMore(true);
  };

  /* ================= SORT ================= */

  const handleSort = (field) => {
    const isAsc = orderBy === field && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(field);
    resetList();
  };

  /* ================= BC FILTER PARSER ================= */

  const parseBCFilter = (field, raw) => {
    if (!raw) return null;

    const type = FIELD_TYPES[field];
    const value = raw.trim();

    if (value.includes("..")) {
      const [from, to] = value.split("..");
      return `${field} ge ${from} and ${field} le ${to}`;
    }

    if (type === "number") {
      if (value.startsWith(">")) return `${field} gt ${value.slice(1)}`;
      if (value.startsWith("<")) return `${field} lt ${value.slice(1)}`;
      return `${field} eq ${value}`;
    }

    if (type === "date") {
      if (!isISODate(value)) return null;
      return `${field} eq ${value}`;
    }

    const safe = escapeOData(value);
    if (value.endsWith("*"))
      return `startswith(${field},'${escapeOData(value.slice(0, -1))}')`;
    if (value.startsWith("*"))
      return `endswith(${field},'${escapeOData(value.slice(1))}')`;

    return `contains(${field},'${safe}')`;
  };

  /* ================= BUILD FILTER ================= */

  const buildODataFilter = () => {
    const clauses = [];

    appliedFilters.forEach((f) => {
      const parsed = parseBCFilter(f.field, f.value);
      if (parsed) clauses.push(parsed);
    });

    if (!clauses.length) return "";
    return `$filter=${encodeURIComponent(clauses.join(" and "))}`;
  };

  /* ================= FETCH LIST ================= */

  const fetchData = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const { token } = JSON.parse(localStorage.getItem("userData")) || {};
      const tenant = process.env.REACT_APP_TENANT_ID;
      const baseUrl = process.env.REACT_APP_BC_BASE_URL;
      const env = process.env.REACT_APP_BC_ENVIRONMENT;
      const company = encodeURIComponent(process.env.REACT_APP_BC_COMPANY);

      const skip = page * PAGE_SIZE;
      const filterQuery = buildODataFilter();

      const url =
        `${baseUrl}/v2.0/${tenant}/${env}/ODataV4/Company('${company}')/salesheaderstagings` +
        `?$top=${PAGE_SIZE}&$skip=${skip}` +
        `&$orderby=${orderBy} ${order}` +
        (filterQuery ? `&${filterQuery}` : "");

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.value || [];
      setRows((p) => [...p, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH ORDER FOR EDIT ================= */

  const fetchOrderForEdit = async (orderNo) => {
    setDialogLoading(true);
    try {
      const { token } = JSON.parse(localStorage.getItem("userData")) || {};

      const tenant = process.env.REACT_APP_TENANT_ID;
      const env = process.env.REACT_APP_BC_ENVIRONMENT;
      const baseUrl = process.env.REACT_APP_BC_BASE_URL;
      const companyId = process.env.REACT_APP_BC_COMPANYID;

      const apiPublisher = "velvotix";
      const apiGroup = "salesstaging";
      const apiVersion = "v2.0";

      const url =
        `${baseUrl}/v2.0/${tenant}/${env}` +
        `/api/${apiPublisher}/${apiGroup}/${apiVersion}` +
        `/companies(${companyId})/salesheaderstagings` +
        `?$expand=lines&$filter=no eq '${orderNo}'`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      // Header + lines come together

      const header = res.data || null;
      setSelectedOrder(header);
      setDialogOpen(true);
    } finally {
      setDialogLoading(false);
    }
  };

  /* ================= APPLY FILTERS ================= */

  const applyFilters = (nextDraft) => {
    setAppliedFilters(nextDraft.filter((f) => f.value));
    resetList();
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters, order, orderBy]);

  /* ================= INFINITE SCROLL ================= */

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([e]) => e.isIntersecting && fetchData(),
      { root: document.getElementById("table-scroll"), threshold: 0.1 },
    );

    if (lastRowRef.current) observer.observe(lastRowRef.current);
    return () => observer.disconnect();
  }, [rows, hasMore, loading]);

  /* ================= UI ================= */

  return (
    <Card sx={{ m: 3 }}>
      <CardContent>
        <IconButton onClick={() => setFilterPaneOpen((p) => !p)}>
          <FilterListIcon />
        </IconButton>

        <Paper sx={{ p: 2, mt: 1 }}>
          <Box display="flex">
            {/* FILTER PANE */}
            <Box
              sx={{
                width: filterPaneOpen ? 260 : 0,
                overflow: "hidden",
                transition: "width 0.25s ease",
                borderRight: filterPaneOpen ? "1px solid #e0e0e0" : "none",
                pr: filterPaneOpen ? 2 : 0,
              }}
            >
              {filterPaneOpen && (
                <>
                  <Button
                    size="small"
                    onClick={() => setAddingFilter(true)}
                    fullWidth
                  >
                    + Add Filter
                  </Button>

                  {addingFilter && (
                    <Select
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                      value=""
                      onChange={(e) => {
                        setDraftFilters((p) => [
                          ...p,
                          { field: e.target.value, value: "" },
                        ]);
                        setAddingFilter(false);
                      }}
                    >
                      {FIELDS.filter(
                        (f) => !draftFilters.some((x) => x.field === f.id),
                      ).map((f) => (
                        <MenuItem key={f.id} value={f.id}>
                          {f.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}

                  {draftFilters.map((f, i) => (
                    <Box key={i} display="flex" gap={1} mt={2}>
                      <TextField
                        size="small"
                        label={FIELDS.find((x) => x.id === f.field)?.label}
                        value={f.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraftFilters((p) =>
                            p.map((x, idx) =>
                              idx === i ? { ...x, value: v } : x,
                            ),
                          );
                        }}
                        onBlur={() => applyFilters(draftFilters)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && applyFilters(draftFilters)
                        }
                        fullWidth
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          const next = draftFilters.filter(
                            (_, idx) => idx !== i,
                          );
                          setDraftFilters(next);
                          applyFilters(next);
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </>
              )}
            </Box>

            {/* TABLE */}
            <TableContainer
              id="table-scroll"
              sx={{
                maxHeight: "65vh",
                overflowY: "auto",
                pl: filterPaneOpen ? 2 : 0,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {FIELDS.map((h) => (
                      <TableCell key={h.id}>
                        <TableSortLabel
                          active={orderBy === h.id}
                          direction={orderBy === h.id ? order : "asc"}
                          onClick={() => handleSort(h.id)}
                        >
                          {h.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow
                      key={r.no}
                      hover
                      ref={i === rows.length - 1 ? lastRowRef : null}
                    >
                      <TableCell>
                        <Link
                          component="button"
                          onClick={() => fetchOrderForEdit(r.no)}
                        >
                          {r.no}
                        </Link>
                      </TableCell>
                      <TableCell>{r.sellToCustomerNo}</TableCell>
                      <TableCell>{r.postingDate}</TableCell>
                      <TableCell>{r.amount}</TableCell>
                      <TableCell>{r.amountIncludingVAT}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {loading && (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </TableContainer>
          </Box>
        </Paper>
      </CardContent>

      {/* FLOATING + BUTTON */}
      <Tooltip title="Create Sales Order">
        <Fab
          color="primary"
          sx={{ position: "fixed", bottom: 24, right: 24 }}
          onClick={() => {
            setSelectedOrder(null);
            setDialogOpen(true);
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <SalesOrderDialog
        open={dialogOpen}
        initialData={selectedOrder}
        loading={dialogLoading}
        onClose={() => setDialogOpen(false)}
      />
    </Card>
  );
}
