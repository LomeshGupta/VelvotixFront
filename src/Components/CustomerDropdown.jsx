import React, { useEffect, useState } from "react";
import { TextField, Autocomplete, CircularProgress } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

export default function CustomerDropdown({ value, onChange }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const { token } = JSON.parse(localStorage.getItem("userData")) || {};
      const tenant = process.env.REACT_APP_TENANT_ID;
      const env = process.env.REACT_APP_BC_ENVIRONMENT;
      const baseUrl = process.env.REACT_APP_BC_BASE_URL;
      const company = encodeURIComponent(process.env.REACT_APP_BC_COMPANY);

      const url =
        `${baseUrl}/v2.0/${tenant}/${env}` +
        `/ODataV4/Company('${company}')/customerAPIs`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCustomers(res.data.value || []);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Autocomplete
      options={customers}
      loading={loading}
      value={customers.find((c) => c.no === value) || null}
      getOptionLabel={(o) => `${o.no} - ${o.name}`}
      isOptionEqualToValue={(o, v) => o.no === v.no}
      onChange={(_, val) => onChange(val)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Customer"
          size="small"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress size={18} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
