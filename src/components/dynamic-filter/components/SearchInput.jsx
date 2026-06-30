import { Search, X } from "lucide-react";

const SearchInput = ({
    value,
    onChange,
    placeholder = "Search...",
    className = "",
    showClear = false,
}) => (
    <div className={`relative ${className}`}>
        <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className={`h-7 w-full rounded border border-slate-200 bg-white pl-7 text-xs text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500 ${showClear ? "pr-7" : "pr-2"}`}
        />
        {showClear && value ? (
            <button
                type="button"
                onClick={() => onChange?.("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
                <X size={13} />
            </button>
        ) : null}
    </div>
);

export default SearchInput;
