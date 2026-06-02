import React from 'react';
import DefaultLabel from './DefaultLabel';


const Select = ({ field, value, onChange, className = '', ...rest }) => {
  const isLocked = Boolean(field.disabled || field.readOnly);
  const options = Array.isArray(field.options) ? field.options : [];

  return (
    <div className="flex flex-col gap-1">
      <DefaultLabel label={field.label} required={field.required} />
      <select
        name={field.name}
        value={value}
        onChange={onChange}
        disabled={isLocked}
        className={`border border-gray-50 text-gray-600 bg-gray-100 px-3 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
        {...rest}
      >
        <option value="">{field.placeholder || `Select ${field.label}`}</option>
        {options.map((opt) => (
          <option key={opt.label} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
