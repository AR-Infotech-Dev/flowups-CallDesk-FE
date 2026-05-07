import DefaultLabel from "./DefaultLabel";
import ValidationError from "./ValidationError";

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
    <div className="flex min-w-0 flex-col gap-2 p-1">
      <DefaultLabel label={field.label} required={field.required} />
      <div className="flex flex-wrap gap-3">
        {options.map((color) => {
          const isActive = value === color;

          return (
            <button
              key={color}
              type="button"
              aria-label={`Select ${color}`}
              title={color}
              disabled={isDisabled}
              onClick={() => handleSelect(color)}
              className={`h-9 w-9 rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isActive ? "scale-105 border-slate-700 shadow-lg" : "border-white/80"
                }`}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>
      {error ? <ValidationError error={error} /> : null}
    </div>
  );
}

export default ColorSwatches;
