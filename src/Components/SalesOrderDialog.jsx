import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import headerConfig from "../Assets/SalesHeader.json";
import lineConfig from "../Assets/SalesLine.json";

/* ---------------- HELPERS ---------------- */

const todayISO = () => new Date().toISOString().split("T")[0];

const DECIMAL_FIELDS = [
  "quantity",
  "unitPrice",
  "lineAmount",
  "amount",
  "amountIncludingVAT",
];

const parseDecimal = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100) / 100;
};

const normalizeDecimals = (obj) => {
  const cleaned = {};
  Object.keys(obj || {}).forEach((k) => {
    if (k === "id") return;
    if (DECIMAL_FIELDS.includes(k)) {
      const n = Number(obj[k]);
      if (!Number.isNaN(n)) cleaned[k] = n;
    } else {
      cleaned[k] = obj[k];
    }
  });
  return cleaned;
};

const getChangedFields = (original, current) => {
  const diff = {};
  Object.keys(current || {}).forEach((key) => {
    if (key === "id") return;
    if (current[key] !== original?.[key]) {
      diff[key] = current[key];
    }
  });
  return diff;
};

/* -------------------------------------------------------- */

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
  const [saving, setSaving] = useState(false);

  // ---------------- INIT (EDIT ONLY + DEFAULT SHIPMENT DATE) ----------------
  useEffect(() => {
    if (!open || !source?.no) return;

    const headerWithDefaults = {
      ...source,
      shipmentDate: source.shipmentDate || todayISO(),
    };

    const linesWithDefaults = (source.lines || []).map((l) => ({
      ...l,
      shipmentDate: l.shipmentDate || headerWithDefaults.shipmentDate,
    }));

    setHeader(headerWithDefaults);
    setLines(linesWithDefaults);
    setOriginalHeader(headerWithDefaults);
    setOriginalLines(linesWithDefaults);
  }, [open]); // source intentionally NOT included

  const updateHeader = (name, value) =>
    setHeader((p) => ({ ...p, [name]: value }));

  const addLine = () => {
    const nextNo = Math.max(0, ...lines.map((l) => l.lineNo || 0)) + 10000;
    setLines((p) => [
      ...p,
      {
        lineNo: nextNo,
        type: "Item",
        no: "",
        locationCode: "",
        shipmentDate: header.shipmentDate,
        description: "",
        description2: "",
        unitOfMeasure: "",
        quantity: 1.0,
      },
    ]);
  };

  // ---------------- SAVE (PATCH ONLY) ----------------
  const handleSave = async () => {
    if (!header.no) return;

    try {
      setSaving(true);
      toast.loading("Saving...", { toastId: "save" });

      const { token } = JSON.parse(localStorage.getItem("userData")) || {};
      const tenant = process.env.REACT_APP_TENANT_ID;
      const baseUrl = process.env.REACT_APP_BC_BASE_URL;
      const env = process.env.REACT_APP_BC_ENVIRONMENT;
      const company = encodeURIComponent(process.env.REACT_APP_BC_COMPANY);

      const headerBaseUrl =
        `${baseUrl}/v2.0/${tenant}/${env}` +
        `/ODataV4/Company('${company}')/salesheaderstagings`;

      const lineBaseUrl =
        `${baseUrl}/v2.0/${tenant}/${env}` +
        `/ODataV4/Company('${company}')/lines`;

      const headerGetUrl =
        `${headerBaseUrl}` +
        `(documentType='${header.documentType}',no='${header.no}')`;

      const freshRes = await fetch(headerGetUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const freshHeader = await freshRes.json();

      const changedHeader = normalizeDecimals(
        getChangedFields(originalHeader, header),
      );

      if (Object.keys(changedHeader).length > 0) {
        await fetch(headerGetUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "If-Match": freshHeader["@odata.etag"],
          },
          body: JSON.stringify({
            documentType: freshHeader.documentType,
            no: freshHeader.no,
            ...changedHeader,
          }),
        });
      }

      for (const line of lines) {
        const originalLine = originalLines.find(
          (l) => l.lineNo === line.lineNo,
        );

        const changedLine = normalizeDecimals(
          originalLine
            ? getChangedFields(originalLine, line)
            : getChangedFields({}, line),
        );

        if (Object.keys(changedLine).length === 0) continue;

        const linePayload = {
          documentType: header.documentType,
          documentNo: header.no,
          lineNo: line.lineNo,
          ...changedLine,
        };

        if (line["@odata.etag"]) {
          await fetch(
            `${lineBaseUrl}` +
              `(documentType='${header.documentType}',documentNo='${header.no}',lineNo=${line.lineNo})`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "If-Match": "*",
              },
              body: JSON.stringify(linePayload),
            },
          );
        } else {
          await fetch(lineBaseUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(linePayload),
          });
        }
      }

      toast.update("save", {
        render: "Saved successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      onClose();
    } catch (e) {
      console.error(e);
      toast.update("save", {
        render: "Save failed",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ---------------- UI ----------------
  if (!source?.no) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Sales Order {header.no}</DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {headerConfig.sections.map((section) => (
              <Paper key={section.id} sx={{ p: 2, mb: 3 }} variant="outlined">
                <Typography variant="h6">{section.title}</Typography>
                <Grid container spacing={2}>
                  {section.fields.map((f) => (
                    <Grid key={f.name} item xs={12} md={12 / section.columns}>
                      <TextField
                        fullWidth
                        label={f.label}
                        value={header[f.name] || ""}
                        onChange={(e) => updateHeader(f.name, e.target.value)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ))}

            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="h6">Sales Lines</Typography>
              <Button onClick={addLine} sx={{ mb: 2 }} variant="contained">
                Add Line
              </Button>

              <div style={{ height: 400 }}>
                <DataGrid
                  rows={lines.map((l, i) => ({ id: i, ...l }))}
                  columns={lineConfig.columns.map((c) => ({
                    field: c.field,
                    headerName: c.label,
                    width: c.width || 130,
                    editable: true,
                    ...(c.type === "decimal" && {
                      type: "number",
                      valueParser: (v) => parseDecimal(v),
                      valueFormatter: (p) =>
                        p.value !== null && p.value !== undefined
                          ? Number(p.value).toFixed(2)
                          : "",
                    }),
                  }))}
                  processRowUpdate={(newRow) => {
                    const { id, ...cleanRow } = newRow;
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === id ? { ...l, ...cleanRow } : l,
                      ),
                    );
                    return newRow;
                  }}
                  experimentalFeatures={{ newEditingApi: true }}
                />
              </div>
            </Paper>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
