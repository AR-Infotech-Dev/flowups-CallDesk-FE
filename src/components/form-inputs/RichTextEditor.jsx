import { useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DefaultLabel from "./DefaultLabel";
import ValidationError from "./ValidationError";

const RichTextEditor = ({ field, value, onChange, className = '', modules, error }) => {
  const quillRef = useRef(null);
  const isReadOnly = Boolean(field.disabled || field.readOnly);
  const handleEditorChange = (content, delta, source, editor) => {
    if (isReadOnly || source !== "user") return;

    // 👇 simulate normal input event
    const nextValue = Boolean(field.plain_text) ? editor.getText().trim() : content;
    if (String(nextValue || "") === String(value || "")) return;

    onChange({
      target: {
        name: field.name,
        value: nextValue,
      },
    });
  };

  return (
    <div className="bg-white" >
      
      {field.label && <DefaultLabel label={field.label} required={field.required} />}
      <ReactQuill
        ref={quillRef}
        name={field.name}
        theme="snow"
        value={value}
        onChange={handleEditorChange}
        className={`mt-0 ${className}`}
        modules={modules}
        readOnly={isReadOnly}
      />
      {error && (
        <ValidationError error={error} />
      )}
    </div>
  );
};

export default RichTextEditor;
