import React from 'react';
import DefaultLabel from './DefaultLabel';
import ValidationError from './ValidationError';


const Input = ({ field, value, onChange, placeholder, className = '', disabled, error, ...rest }) => {
  const isDisabled = Boolean(disabled || field.disabled);
  const isReadOnly = Boolean(field.readOnly);

  return (
    <div className="flex min-w-0 flex-col gap-1 p-0 relative">
      <DefaultLabel label={field.label} required={field.required} />
      <input
        type={field.type}
        name={field.name || ''}
        value={value ?? ""}
        onChange={onChange}
        placeholder={field.placeholder}
        required={field.required}
        className={`border ${!error ? "border-gray-50 text-gray-600" : 'border-red-400 text-red-500'} bg-gray-100 px-3 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-70 read-only:cursor-default ${className}`}
        disabled={isDisabled}
        readOnly={isReadOnly}
        {...rest}
      />
      {error && (
        <ValidationError error={error} />
      )}
    </div>
  );
};

export default Input;
