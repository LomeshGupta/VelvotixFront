import React, { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

export default function ProductDropdownCell(params) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { token } = JSON.parse(localStorage.getItem("userData")) || {};
      const tenant = process.env.REACT_APP_TENANT_ID;
      const env = process.env.REACT_APP_BC_ENVIRONMENT;
      const baseUrl = process.env.REACT_APP_BC_BASE_URL;
      const company = encodeURIComponent(process.env.REACT_APP_BC_COMPANY);

      const url =
        `${baseUrl}/v2.0/${tenant}/${env}` +
        `/ODataV4/Company('${company}')/productAPI`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts(res.data.value || []);
    } catch {
      toast.error("Failed to load products");
    }
  };

  return (
    <Autocomplete
      options={products}
      autoHighlight
      fullWidth
      value={products.find((p) => p.no === params.value) || null}
      getOptionLabel={(o) => `${o.no} - ${o.description}`}
      isOptionEqualToValue={(o, v) => o.no === v.no}
      onChange={(_, val) => {
        if (!val) return;

        params.api.setEditCellValue({
          id: params.id,
          field: "no",
          value: val.no,
        });

        params.api.setEditCellValue({
          id: params.id,
          field: "description",
          value: val.description,
        });
      }}
      renderInput={(paramsInput) => <TextField {...paramsInput} size="small" />}
    />
  );
}
