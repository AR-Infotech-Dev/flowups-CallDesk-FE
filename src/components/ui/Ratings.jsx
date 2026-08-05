import { Star } from "lucide-react";

function Ratings({ ratings = 0, className = "", showValue = false }) {
    const normalizedRating = Math.min(5, Math.max(0, Number(ratings) || 0));

    return (
        <span
            className={`inline-flex items-center gap-1.5 ${className}`}
            aria-label={`${normalizedRating} out of 5 stars`}
        >
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
                <Star
                    key={index}
                    className={`h-3.5 w-3.5 ${index < normalizedRating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"}`}
                />
            ))}
          </span>
          {showValue ? <span className="text-xs font-semibold tabular-nums text-slate-600">{normalizedRating.toFixed(1)}</span> : null}
        </span>
    );
}

export default Ratings;
