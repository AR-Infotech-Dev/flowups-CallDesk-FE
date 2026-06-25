import DefaultLabel from "./DefaultLabel";
import ValidationError from "./ValidationError";

const RichTextEditor = ({ field, value, onChange, className = "", error }) => {
  const isReadOnly = Boolean(field.disabled || field.readOnly);

  const handleEditorChange = (event) => {
    if (isReadOnly) return;

    onChange({
      target: {
        name: field.name,
        value: event.target.value,
      },
    });
  };

  return (
    <div className="flex flex-col gap-1 bg-white">
      {field.label && <DefaultLabel label={field.label} required={field.required} />}
      <textarea
        name={field.name}
        rows={field.rows || 5}
        value={value || ""}
        onChange={handleEditorChange}
        placeholder={field.placeholder}
        disabled={Boolean(field.disabled)}
        readOnly={isReadOnly}
        className={`rounded border border-slate-50 bg-gray-100 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      />
      {error && <ValidationError error={error} />}
    </div>
  );
};

export default RichTextEditor;
