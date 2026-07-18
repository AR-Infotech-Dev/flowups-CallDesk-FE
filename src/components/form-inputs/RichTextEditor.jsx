import { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DefaultLabel from "./DefaultLabel";
import ValidationError from "./ValidationError";

const RichTextEditor = ({ field, value, onChange, className = "", modules, error }) => {
  const quillRef = useRef(null);
  const isFocusedRef = useRef(false);
  const isReadOnly = Boolean(field.disabled || field.readOnly);
  const isPlainText = Boolean(field.plain_text);
  const [editorValue, setEditorValue] = useState(value || "");

  useEffect(() => {
    if (isFocusedRef.current) return;
    setEditorValue(value || "");
  }, [value]);

  const handleEditorChange = (content, delta, source, editor) => {
    if (isReadOnly || source !== "user") return;

    setEditorValue(content);

    const nextValue = isPlainText ? editor.getText().replace(/\n$/, "").trim() : content;
    if (String(nextValue || "") === String(value || "")) return;

    onChange?.({
      target: {
        name: field.name,
        value: nextValue,
      },
    });
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
  };

  return (
    <div className="bg-white relative mb-2 rich-text-editor-field">
      {field.label && <DefaultLabel label={field.label} required={field.required} />}
      <ReactQuill
        ref={quillRef}
        name={field.name}
        theme="snow"
        value={editorValue}
        onChange={handleEditorChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`mt-0 flowups-rich-text-editor ${className}`}
        modules={modules}
        readOnly={isReadOnly}
      />
      {error && <ValidationError error={error} classes="-bottom-4" />}
    </div>
  );
};

export default RichTextEditor;
