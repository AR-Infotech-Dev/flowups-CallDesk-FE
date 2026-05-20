import React from 'react'
import DefaultLabel from "./DefaultLabel";
import ValidationError from './ValidationError';


function Radio({ field, value, onChange, className = '', error,...rest }) {
    const isDisabled = Boolean(field.disabled || field.readOnly);
    const emitChange = (name, value) => { onChange?.({ target: { name, value } }); };
    return (
        <div className="flex flex-col gap-1 p-0">
            <DefaultLabel label={field.label} required={field.required} />
            <div className="flex flex-wrap gap-2 pt-0">
                {(field.options || []).map((option) => {
                    const isActive = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => !isDisabled && emitChange(field.name, option.value)}
                            disabled={isDisabled}
                            className={`rounded-md border px-4 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-70 ${isActive ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                            {option.label}
                        </button>
                    );
                })}
            </div>
            {error && (
                <ValidationError error={error} />
            )}
        </div>
    )
}

export default Radio;
