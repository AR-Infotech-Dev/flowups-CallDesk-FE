import DefaultLabel from "./DefaultLabel";
import ValidationError from "./ValidationError";
import { Check } from "lucide-react";
function ColorSwatches({ field, value, onChange, error }) {
  const options = field.options || [];
  const isDisabled = Boolean(field.disabled || field.readOnly);

  const handleSelect = (color) => {
    if (isDisabled) {
      return;
    }

    onChange?.({
      target: {
        name: field.name,
        value: color,
      },
    });
  };

  return (
    <div className="relative flex min-w-0 flex-col gap-2 p-1 mb-1">
      <DefaultLabel label={field.label} required={field.required} />
      <div className="flex flex-wrap gap-3">
        {options.map((color) => {
          const isActive = value === color;
          return (
            <button
              key={color}
              type="button"
              aria-pressed={isActive}
              aria-label={`Select ${color}`}
              title={color}
              disabled={isDisabled}
              onClick={() => handleSelect(color)}
              className={
                `relative h-9 w-9 rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-60 
                ${isActive
                  ? "scale-110 ring-2 ring-blue-600 ring-offset-2"
                  : "ring-1 ring-slate-200 hover:scale-105"
                }
                `}
              style={{ backgroundColor: color }}
            >
              
              {
                isActive
                  ? <Check className="absolute top-0 right-0 " color="#0f23fa" size={16} />
                  : null
              }
            </button>
          );
        })}
      </div>
      {error ? <ValidationError error={error} classes={'-bottom-4'} /> : null}
    </div>
  );
}

export default ColorSwatches;
