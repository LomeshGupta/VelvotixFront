import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import axios from "axios";
import headerConfig from "../Assets/SalesHeader.json";
import lineConfig from "../Assets/SalesLine.json";
import CustomerDropdown from "./CustomerDropdown";
import ProductDropdownCell from "./productDropDown";

/* ================= CONSTANTS ================= */

const todayISO = () => new Date().toISOString().split("T")[0];
const AUTOSAVE_DELAY = 500;
const NEW_LINE_ID = "__NEW__";

const EDITABLE_LINE_FIELDS = [
  "itemNo",
  "description",
  "quantity",
  "unitPrice",
  "shipmentDate",
];

const DECIMAL_FIELDS = ["quantity", "unitPrice"];

/* ================= HELPERS ================= */

const normalizeDecimals = (obj) => {
  const out = {};
  Object.keys(obj || {}).forEach((k) => {
    if (k === "id") return;
    out[k] = DECIMAL_FIELDS.includes(k) ? Number(obj[k]) : obj[k];
  });
  return out;
};

const getChangedFields = (original, current) => {
  const diff = {};
  Object.keys(current || {}).forEach((k) => {
    if (k !== "id" && current[k] !== original?.[k]) {
      diff[k] = current[k];
    }
  });
  return diff;
};

const getNextLineNo = (lines = []) => {
  const max = Math.max(
    0,
    ...lines.filter((l) => !l.isNew).map((l) => Number(l.lineNo) || 0),
  );
  return max + 10000;
};

/* ================================================= */

export default function SalesOrderDialog({
  open,
  initialData,
  loading,
  onClose,
}) {
  const source = initialData?.value?.[0];

  const [header, setHeader] = useState({});
  const [lines, setLines] = useState([]);
  const [originalHeader, setOriginalHeader] = useState({});
  const [originalLines, setOriginalLines] = useState([]);
  const [status, setStatus] = useState("Saved");
  const [expanded, setExpanded] = useState({});
  const [dirty, setDirty] = useState(false);
  const apiRef = useGridApiRef();
  const focusAfterInsertRef = useRef(null);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);

  const saveTimer = useRef(null);
  const isCellEditing = useRef(false);
  const latestLinesRef = useRef([]);

  /* ================= BLANK LINE ================= */

  const addBlankLine = (apiLines = []) => {
    const nextLineNo = getNextLineNo(apiLines);

    return [
      ...apiLines,
      {
        id: NEW_LINE_ID,
        lineNo: nextLineNo,
        type: "Item",
        itemNo: "",
        description: "",
        quantity: 0,
        unitPrice: 0,
        shipmentDate: header.shipmentDate || todayISO(),
        isNew: true,
      },
    ];
  };

  /* ================= INIT ================= */

  useEffect(() => {
    if (!open || !source?.no) return;

    const h = { ...source, shipmentDate: source.shipmentDate || todayISO() };
    const l = source.lines || [];

    setHeader(h);
    setLines(addBlankLine(l));
    setOriginalHeader(h);
    setOriginalLines(l);
    setDirty(false);
    setStatus("Saved");

    const initExpand = {};
    headerConfig.sections.forEach((s) => (initExpand[s.id] = true));
    setExpanded(initExpand);
  }, [open, source?.no]);

  /* ================= KEEP LATEST LINES ================= */

  useEffect(() => {
    latestLinesRef.current = lines;
  }, [lines]);

  /* ================= AUTOSAVE ================= */

  useEffect(() => {
    if (!dirty || isCellEditing.current) return;
    clearTimeout(saveTimer.current);
    setStatus("Not saved");
    saveTimer.current = setTimeout(autoSave, AUTOSAVE_DELAY);
  }, [lines, dirty]);

  /* ================= REFRESH ================= */

  const refreshOrderFromApi = async (orderNo) => {
    const { token } = JSON.parse(localStorage.getItem("userData")) || {};
    const tenant = process.env.REACT_APP_TENANT_ID;
    const env = process.env.REACT_APP_BC_ENVIRONMENT;
    const baseUrl = process.env.REACT_APP_BC_BASE_URL;
    const companyId = process.env.REACT_APP_BC_COMPANYID;

    const url =
      `${baseUrl}/v2.0/${tenant}/${env}` +
      `/api/velvotix/salesstaging/v2.0/companies(${companyId})/salesheaderstagings` +
      `?$expand=lines&$filter=no eq '${orderNo}'`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const fresh = res.data?.value?.[0];
    if (!fresh) throw new Error("Refresh failed");

    setHeader(fresh);
    setLines(addBlankLine(fresh.lines || []));
    setOriginalHeader(fresh);
    setOriginalLines(fresh.lines || []);
    setDirty(false);
    setStatus("Saved");
    // setTimeout(() => {
    //   if (!focusAfterInsertRef.current) return;

    //   const { lineNo, field } = focusAfterInsertRef.current;

    //   apiRef.current.setCellFocus(lineNo, field);
    //   apiRef.current.startCellEditMode({
    //     id: lineNo,
    //     field,
    //   });

    //   focusAfterInsertRef.current = null;
    // }, 0);
  };

  /* ================= HEADER ================= */

  const handleHeaderChange = (field, value) => {
    setHeader((p) => ({ ...p, [field]: value }));
    setDirty(true);
  };

  /* ================= LINE CHANGE ================= */

  const handleLineChange = (row) => {
    setLines((p) =>
      p.map((l) =>
        Number(l.lineNo) === Number(row.lineNo) ? { ...l, ...row } : l,
      ),
    );
    setDirty(true);
  };

  /* ================= INSERT LINE ================= */

  const insertLine = async (row) => {
    try {
      const { token } = JSON.parse(localStorage.getItem("userData")) || {};
      const tenant = process.env.REACT_APP_TENANT_ID;
      const env = process.env.REACT_APP_BC_ENVIRONMENT;
      const baseUrl = process.env.REACT_APP_BC_BASE_URL;
      const company = encodeURIComponent(process.env.REACT_APP_BC_COMPANY);

      const url =
        `${baseUrl}/v2.0/${tenant}/${env}` +
        `/ODataV4/Company('${company}')/lines`;

      await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentType: header.documentType,
          documentNo: header.no,
          lineNo: row.lineNo,
          type: "Item",
          no: row.no,
        }),
      });

      toast.success("Line added");
      await refreshOrderFromApi(header.no);
    } catch {
      toast.error("Insert failed");
    }
  };

  /* ================= DELETE LINE ================= */

  const deleteLine = async () => {
    try {
      const { token } = JSON.parse(localStorage.getItem("userData")) || {};
      const tenant = process.env.REACT_APP_TENANT_ID;
      const env = process.env.REACT_APP_BC_ENVIRONMENT;
      const baseUrl = process.env.REACT_APP_BC_BASE_URL;
      const company = encodeURIComponent(process.env.REACT_APP_BC_COMPANY);

      const url =
        `${baseUrl}/v2.0/${tenant}/${env}` +
        `/ODataV4/Company('${company}')/lines` +
        `(documentType='${header.documentType}',documentNo='${header.no}',lineNo=${selectedLine.lineNo})`;

      await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Line deleted");
      await refreshOrderFromApi(header.no);
    } catch {
      toast.error("Delete failed");
    } finally {
      setMenuAnchor(null);
      setSelectedLine(null);
    }
  };

  /* ================= SAVE (UNCHANGED CORE LOGIC) ================= */

  const autoSave = async () => {
    let allOk = true;

    try {
      setStatus("Saving...");

      const { token } = JSON.parse(localStorage.getItem("userData")) || {};
      const tenant = process.env.REACT_APP_TENANT_ID;
      const env = process.env.REACT_APP_BC_ENVIRONMENT;
      const baseUrl = process.env.REACT_APP_BC_BASE_URL;
      const company = encodeURIComponent(process.env.REACT_APP_BC_COMPANY);

      /* ---------- HEADER ---------- */

      const headerUrl =
        `${baseUrl}/v2.0/${tenant}/${env}` +
        `/ODataV4/Company('${company}')/salesheaderstagings` +
        `(documentType='${header.documentType}',no='${header.no}')`;

      const freshHeader = await fetch(headerUrl, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());

      const headerDiff = normalizeDecimals(
        getChangedFields(originalHeader, header),
      );

      if (Object.keys(headerDiff).length) {
        const res = await fetch(headerUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "If-Match": freshHeader["@odata.etag"],
          },
          body: JSON.stringify(headerDiff),
        });
        if (!res.ok) allOk = false;
      }

      /* ---------- LINES ---------- */

      for (const line of latestLinesRef.current) {
        if (line.isNew) continue; // DO NOT SAVE BLANK LINE

        const orig = originalLines.find(
          (l) => Number(l.lineNo) === Number(line.lineNo),
        );
        if (!orig) continue;

        const diff = normalizeDecimals(
          Object.fromEntries(
            Object.entries(getChangedFields(orig, line)).filter(([k]) =>
              EDITABLE_LINE_FIELDS.includes(k),
            ),
          ),
        );

        if (!Object.keys(diff).length) continue;

        const lineUrl =
          `${baseUrl}/v2.0/${tenant}/${env}` +
          `/ODataV4/Company('${company}')/lines` +
          `(documentType='${header.documentType}',documentNo='${header.no}',lineNo=${line.lineNo})`;

        const freshLine = await fetch(lineUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json());
        console.log(diff);
        const res = await fetch(lineUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "If-Match": freshLine["@odata.etag"],
          },
          body: JSON.stringify(diff),
        });

        if (!res.ok) allOk = false;
      }

      if (allOk) {
        refreshOrderFromApi(header.no);
        setDirty(false);
        setStatus("Saved");
      } else {
        setStatus("Not saved");
        toast.error("Some changes could not be saved");
      }
    } catch (e) {
      console.error(e);
      setStatus("Not saved");
      toast.error("Auto save failed");
    }
  };

  if (!source?.no) return null;

  /* ================= UI ================= */

  const actionColumn = {
    field: "actions",
    headerName: "",
    width: 60,
    sortable: false,
    renderCell: (params) =>
      params.row.isNew ? null : (
        <IconButton
          size="small"
          onClick={(e) => {
            setMenuAnchor(e.currentTarget);
            setSelectedLine(params.row);
          }}
        >
          <MoreVertIcon />
        </IconButton>
      ),
  };

  return (
    <Dialog open={open} maxWidth="xl" fullWidth onClose={onClose}>
      <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
        <IconButton onClick={onClose}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>Sales Order {header.no}</Box>
        <Typography variant="body2">{status}</Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {headerConfig.sections.map((section) => (
              <Paper key={section.id} sx={{ mb: 2 }} variant="outlined">
                <Box
                  sx={{ p: 2, display: "flex", cursor: "pointer" }}
                  onClick={() =>
                    setExpanded((p) => ({
                      ...p,
                      [section.id]: !p[section.id],
                    }))
                  }
                >
                  <Typography sx={{ flexGrow: 1 }}>{section.title}</Typography>
                  <ExpandMoreIcon />
                </Box>

                <Collapse in={expanded[section.id]}>
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {section.fields.map((f) => {
                        if (f.name === "sellToCustomerNo") {
                          return (
                            <Grid key={f.name} item xs={12} md={4}>
                              <CustomerDropdown
                                value={header.sellToCustomerNo}
                                onChange={(cust) => {
                                  if (!cust) return;
                                  handleHeaderChange(
                                    "sellToCustomerNo",
                                    cust.no,
                                  );
                                  handleHeaderChange(
                                    "sellToCustomerName",
                                    cust.name,
                                  );
                                }}
                              />
                            </Grid>
                          );
                        }

                        return (
                          <Grid key={f.name} item xs={12} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label={f.label}
                              value={header[f.name] || ""}
                              onChange={(e) =>
                                handleHeaderChange(f.name, e.target.value)
                              }
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                </Collapse>
              </Paper>
            ))}

            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="h6">Sales Lines</Typography>
              <Box sx={{ height: 420 }}>
                <DataGrid
                  apiRef={apiRef}
                  getRowId={(row) => row.lineNo}
                  rows={lines.map((l) => ({ id: l.lineNo, ...l }))}
                  columns={[
                    actionColumn,
                    ...lineConfig.columns.map((c) => ({
                      field: c.field,
                      headerName: c.label,
                      width: c.width || 130,
                      editable: c.field !== "type",
                    })),
                  ]}
                  onCellEditStart={() => (isCellEditing.current = true)}
                  onCellEditStop={() => (isCellEditing.current = false)}
                  processRowUpdate={(newRow, oldRow) => {
                    if (!newRow["@odata.etag"] && newRow.no) {
                      focusAfterInsertRef.current = {
                        lineNo: newRow.lineNo,
                        field: "description",
                      };

                      insertLine(newRow);
                      return newRow;
                    }

                    handleLineChange(newRow);
                    return newRow;
                  }}
                  experimentalFeatures={{ newEditingApi: true }}
                />
              </Box>
            </Paper>
          </>
        )}
      </DialogContent>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={deleteLine}>Delete</MenuItem>
      </Menu>
    </Dialog>
  );
}
