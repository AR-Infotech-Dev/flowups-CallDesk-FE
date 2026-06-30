import React from "react";

function ValidationError({ error }) {
  return (
    <div className="min-h-4.5 w-full absolute -bottom-3">
      {error ? (
        <p className="text-xs text-red-500 mt-1">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default ValidationError;