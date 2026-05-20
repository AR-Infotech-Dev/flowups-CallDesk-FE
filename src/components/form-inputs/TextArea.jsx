import React from 'react'
import DefaultLabel from './DefaultLabel'

function TextArea({field , value , onChange}) {
    const isDisabled = Boolean(field.disabled);
    const isReadOnly = Boolean(field.readOnly);

    return (
        <div className="flex flex-col gap-1 p-1">
            <DefaultLabel label={field.label} required={field.required} />
            <textarea
                name={field.name}
                rows={field.rows || 4}
                value={value}
                onChange={onChange}
                placeholder={field.placeholder}
                disabled={isDisabled}
                readOnly={isReadOnly}
                className="rounded border border-slate-50 bg-gray-100 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-70 read-only:cursor-default"
            />
        </div>
    )
}

export default TextArea
