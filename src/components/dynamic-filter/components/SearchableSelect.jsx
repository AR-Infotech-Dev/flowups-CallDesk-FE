import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const SearchableSelect = ({
    value = "",
    options = [],
    placeholder = "Select",
    onChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const rootRef = useRef(null);

    const selectedOption = useMemo(
        () => options.find((option) => String(option.value) === String(value)),
        [options, value]
    );

    const filteredOptions = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();
        if (!normalizedSearch) return options;

        return options.filter((option) =>
            String(option.label || "").toLowerCase().includes(normalizedSearch)
        );
    }, [options, searchText]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (rootRef.current?.contains(event.target)) return;
            setIsOpen(false);
            setSearchText("");
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handleSelect = (nextValue) => {
        onChange?.(nextValue);
        setIsOpen(false);
        setSearchText("");
    };

    return (
        <div ref={rootRef} className="relative rounded border border-gray-300 bg-white">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="flex h-7 w-full items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2 text-left text-xs text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500"
            >
                <span className={selectedOption ? "truncate" : "truncate text-slate-400"}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown size={13} className="shrink-0 text-slate-400" />
            </button>

            {isOpen ? (
                <div className="absolute left-0 top-8 z-40 w-full rounded border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 p-1">
                        <div className="relative">
                            <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search..."
                                className="h-7 w-full rounded border border-slate-200 bg-white pl-6 pr-6 text-xs outline-none placeholder:text-slate-400 focus:border-blue-500"
                                autoFocus
                            />
                            {searchText ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchText("")}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={12} />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="max-h-44 overflow-y-auto p-1">
                        {filteredOptions.length ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`block w-full truncate rounded px-2 py-1.5 text-left text-xs hover:bg-blue-50 hover:text-blue-700 ${
                                        String(option.value) === String(value)
                                            ? "bg-blue-50 font-semibold text-blue-700"
                                            : "text-slate-600"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="py-4 text-center text-xs text-slate-500">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default SearchableSelect;
