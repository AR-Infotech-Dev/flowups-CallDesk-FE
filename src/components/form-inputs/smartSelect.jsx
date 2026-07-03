import React, { useEffect, useState } from "react";
import { makeRequest } from "@api/httpClient";
import DefaultLabel from "./DefaultLabel";
import ValidationError from "./ValidationError";

function SmartSelect({ field, value, onSelect, onObjectSelect, config = {}, error }) {
  const isLocked = Boolean(field.disabled || field.readOnly);
  const {
    apiUrl = "/system/searchList",
    tableName = "",
    status = "false",
    selectFields = "*",
    searchField = "name",
    isCompanyWise = false,
    slug = null,
    labelKey = "label",
    valueKey = "id",
    countKey = "",
    countLabel = "",
    placeholder = "Select",
  } = config;

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const res = await makeRequest(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          text: "",
          tableName,
          wherec: searchField,
          list: selectFields,
          slug: slug,
          status: status,
          isCompanyWise,
        },
      });

      // const rows = (!slug) ? res?.data || [] : res?.data ? [0].sublist || [] ;
      const rows = !slug
        ? res?.data || []
        : res?.data?.[0]?.sublist || [];

      const formatted = rows.map((item) => {
        const count = countKey ? Number(item[countKey] || 0) : null;
        const label = countKey
          ? `${item[labelKey]} (${count}${countLabel ? ` ${countLabel}` : ""})`
          : item[labelKey];

        return {
          value: item[valueKey],
          label,
          original: item,
        };
      });

      setOptions(formatted);
    } catch (error) {
      console.error("Select Load Error:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (!value || !options.length) return;
    const matched = options.find((item) => String(item.value) === String(value));
    if (matched) {
      onObjectSelect?.(matched.original || matched);
    }
  }, [value, options]);

  const handleChange = (event) => {
    onSelect?.(event);
    const matched = options.find((item) => String(item.value) === String(event.target.value));
    onObjectSelect?.(matched?.original || {});
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      {field?.label && (<DefaultLabel label={field.label} required={field.required} />)}
      {/* Select */}
      <select name={field.name} value={value || ""} onChange={handleChange} disabled={isLocked} className={`border ${error ? "border-red-400 text-red-600" : "border-gray-50 text-gray-600"} bg-gray-100 px-3 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-70 `}>
        <option value="">{loading ? "Loading..." : placeholder}</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
      {error && (
        <ValidationError error={error} />
      )}
    </div>
  );
}

export default SmartSelect;
