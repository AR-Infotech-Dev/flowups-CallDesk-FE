import React, { useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { makeRequest } from "../../api/httpClient";
import { Circle } from "lucide-react";
import { API_BASE_URL } from '../../api/config';
import { Check } from 'lucide-react';
import DefaultLabel from './DefaultLabel';
import ValidationError from './ValidationError';
const cacheStore = new Map();
function StatusIndicator({ status }) {
  return (
    <div className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border ${status === "active" ? "border-green-400" : "border-red-400"}`} >
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: status === "active" ? "#22c55e" : "#ef4444",
          boxShadow:
            status === "active"
              ? "0 0 6px #22c55e, 0 0 12px #22c55e"
              : "0 0 6px #ef4444, 0 0 12px #ef4444",
        }}
      />
    </div>
  );
}
const SmartSelectInput = ({ id, field = {}, value, onSelect, onObjectSelect, config = {}, error, addNewFunction }) => {

  const isLocked = Boolean(field.disabled || field.readOnly);
  const {
    type = 'category',
    source = '',
    label = '',
    check = '',
    list = '',
    placeholder = 'Select...',
    allowAddNew = false,
    showRecent = false,
    preload = false,
    cache = true,
    multi = false,
    getValue,
    getLabel,
    apiUrl = "",
    countKey = "",
    countLabel = "",
    customURL = "",
    statusCheck = false,
    customParameters = {},
  } = config;
  // const { openCategoryCreate } = useCategoryCreateStore();
  const key = `${type}-${source}`;
  const [options, setOptions] = useState([]);
  const [internalValue, setInternalValue] = useState(multi ? [] : null);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState("0");
  const listRef = useRef(null);

  // Normalize fetched items
  const normalizeOptions = (items = []) => items.map(item => {
    const baseLabel = getLabel ? getLabel(item) : item.name || 'Unnamed';
    const count = countKey ? Number(item[countKey] || 0) : null;
    const label = countKey
      ? `${baseLabel} (${count}${countLabel ? ` ${countLabel}` : ""})`
      : baseLabel;

    return {
      value: getValue ? getValue(item) : item.id,
      label,
      original: item,
    };
  });

  // Fetch once, then always filter locally
  const fetchOptions = async (page) => {
    setLoading(true);
    const headers = {};
    let res = {}, data = [], newOptions = [];
    if (type === 'category') {
      let urlType = customURL || `${API_BASE_URL}/searchSlugList`;
      const posData = customURL ? customParameters : { status: 'active', slug: source };
      res = await makeRequest(urlType, {
        method: 'POST', headers,
        body: posData,
      });
      data = customURL ? res?.data || [] : res.data[0]?.sublist || [];
    } else {
      // res = await fetchJson(`${API_BASE_URL}/searchList`, {
      res = await makeRequest(apiUrl || `${API_BASE_URL}/system/searchList`, {
        method: 'POST', headers,
        body: JSON.stringify({
          text: '',
          system: "new",
          tableName: type === 'customer' ? 'customer' : source,
          wherec: type === 'customer' ? 'name' : check,
          status: statusCheck,
          list,
          curpage: page,
          ...customParameters,
        }),
      });
      data = res.data || [];
    }
    const normalized = normalizeOptions(data);
    //setOptions(normalized);
    newOptions = normalizeOptions(data);
    setOptions((prev) => {
      const existingIds = new Set(prev.map(item => item.value));
      const uniqueNew = newOptions.filter(item => !existingIds.has(item.value));
      return [...prev, ...uniqueNew];
    });
    setHasMore(res.loadstate);
    // setPage(res?.paginginfo?.nextPage);
    if (cache) cacheStore.set(key, normalized);
    if (showRecent)
      localStorage.setItem(`recent_${key}`, JSON.stringify(data.slice(0, 5)));
    setLoading(false);
  };

  // Fetch once on mount
  useEffect(() => {
    if (preload || cache) {
      const recent = localStorage.getItem(`recent_${key}`);
      if (recent) setOptions(normalizeOptions(JSON.parse(recent)));
      else fetchOptions();
    }
  }, []);
  const handleScroll = ({ scrollOffset, scrollDirection, scrollUpdateWasRequested }) => {
    const listEl = listRef.current;
    if (!listEl) return;

    const { scrollHeight, clientHeight, scrollTop } = listEl._outerRef;

    // If user scrolled near bottom
    if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loading) {
      console.info("Fetch next page", page);
      fetchOptions(page);
    }
  };
  useEffect(() => {
    let alive = true;

    const toIdArray = (v) => {
      if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
      if (v === null || v === undefined) return [];
      return String(v)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    };

    const ids = toIdArray(value);

    // If value is cleared, clear internal selection and exit
    const isCleared =
      (multi && ids.length === 0) ||
      (!multi && (value === null || value === undefined || String(value).trim() === ''));

    const applyMatch = (pool) => {
      if (!alive) return;
      const matched = pool.filter(opt => ids.includes(String(opt.value)));
      setInternalValue(multi ? matched : (matched[0] ?? null));
      if (matched.length) {
        onObjectSelect?.(multi ? matched : matched[0]);
      }
    };

    if (isCleared) {
      setInternalValue(multi ? [] : null);
      return () => { alive = false; };
    }

    const cached = cacheStore.get(key);

    if (cached && cached.length) {
      applyMatch(cached);
    } else {
      (async () => {
        try {
          await fetchOptions(); // should populate cacheStore for `key`
        } finally {
          const fresh = cacheStore.get(key) || [];
          applyMatch(fresh);
        }
      })();
    }

    return () => { alive = false; };
  }, [value, key, multi]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);
  const handleSelect = (item) => {
    if (isLocked) return;

    if (multi) {
      let selected = Array.isArray(internalValue) ? [...internalValue] : [];
      const already = selected.find(v => v.value === item.value);
      selected = already ? selected.filter(v => v.value !== item.value) : [...selected, item];
      setInternalValue(selected);
      onSelect?.(selected.map(i => i.value).join(','));
      onObjectSelect?.(item);
    } else {
      setInternalValue(item);
      setInputValue('');  // reset after select
      setShowDropdown(false);
      onSelect?.(item.value);
      onObjectSelect?.(item);
    }
  };

  const selectCreatedOption = (item = {}) => {
    const option = item?.value && item?.label
      ? item
      : normalizeOptions([item?.original || item])[0];

    if (!option) return;

    setOptions((current) => {
      const withoutDuplicate = current.filter((existing) => String(existing.value) !== String(option.value));
      const nextOptions = [option, ...withoutDuplicate];
      cacheStore.set(key, nextOptions);
      return nextOptions;
    });

    handleSelect(option);
  };

  const handleAddNew = () => {
    if (isLocked || typeof addNewFunction !== "function") return;
    setShowDropdown(false);
    addNewFunction({
      searchText: inputValue || "",
      selectOption: selectCreatedOption,
      refreshOptions: handleRefresh,
    });
  };

  const handleClear = () => {
    if (isLocked) return;

    setInternalValue(multi ? [] : null);
    setInputValue(null);
    setShowDropdown(false);
    onSelect?.('');
    onObjectSelect?.({});
  };
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
  const handleRefresh = () => {
    if (isLocked) return;

    cacheStore.delete(key);
    localStorage.removeItem(`recent_${key}`);
    setPage(0);
    setOptions([]);
    fetchOptions();
  };
  // const handleNew = (rowData) => {

  //     // check type
  //     setShowDropdown(false);
  //     const entityType = config.type;
  //     const storeHook = createEntityMap[entityType];

  // if (storeHook) {
  //   const openCreate = storeHook.getState().open?.[`${entityType}Create`] || storeHook.getState()[`open${capitalize(entityType)}Create`];
  //   if (typeof openCreate === 'function') {
  //     openCreate({ payload: rowData }, async (result) => {
  //       if(result){
  //         cacheStore.delete(key);
  //         localStorage.removeItem(`recent_${key}`);
  //         await fetchOptions();
  //         const allOptions = cacheStore.get(key) || [];
  //         const lastID = result.last_insert_id ? result.last_insert_id : result.lastID;
  //         const selected = allOptions.find(opt => String(opt.value) === String(lastID));
  //         if (selected) {
  //           setInternalValue(selected);
  //           onSelect(selected.value);
  //           onObjectSelect?.(selected.original);
  //         }
  //       }
  //     });
  //   } else {
  //     console.warn(`No openCreate method found for type: ${entityType}`);
  //   }
  // } else {
  //   console.warn(`No store registered for type: ${entityType}`);
  // }
  // };

  // **Local filtering**
  const filteredOptions = inputValue
    ? options.filter(opt =>
      opt.label && opt.label.toLowerCase().includes(inputValue.toLowerCase())
    )
    : options;

  const Row = ({ index, style }) => {
    const item = filteredOptions[index];
    const isSelected = multi
      ? internalValue.some(v => v.value === item.value)
      : internalValue?.value === item.value;
    console.log('item : ', item);

    return (
      <div
        style={style}
        onClick={() => handleSelect(item)}
        className="cursor-pointer px-4 py-2 hover:bg-gray-100 flex items-start items-center justify-between text-sm"
      >
        <span className="whitespace-normal break-words">
          {item.label}
        </span>
        {isSelected && <Check size={16} className="text-green-600 ml-2" />}
        {item.original.status && item.original.status != "" && <StatusIndicator status={item.original.status} />}
      </div>
    );
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {(field.label || label) && (
        <DefaultLabel label={field.label || label} required={field.required} />
      )}
      <div ref={containerRef} className="relative w-full">
        {multi ? (
          <div onClick={() => { if (!isLocked) { setShowDropdown(true); inputRef.current?.focus(); } }}
            aria-disabled={isLocked}
            className={`flex min-h-[34px] w-full flex-wrap gap-1 rounded border bg-gray-100 px-3 py-1.5 text-sm transition-all focus-within:outline-none focus-within:ring-2 focus-within:ring-purple-100 ${isLocked ? "cursor-not-allowed opacity-70" : ""} ${error ? "border-red-400 text-red-600" : "border-gray-50 text-gray-600"}`}>
            {internalValue.map((v, i) => (
              <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
                {v.label}
                {!isLocked && <button onClick={(e) => {
                  e.stopPropagation();
                  const updated = internalValue.filter(item => item.value !== v.value);
                  setInternalValue(updated);
                  onObjectSelect?.(updated);
                  onSelect?.(updated.map(i => i.value).join(','));
                }} className="ml-1">&times;</button>}
              </span>
            ))}
            <input
              ref={inputRef}
              name={id}
              onBlur={() => {
                if (!multi && inputValue === '') {
                  setInternalValue(null);
                  onSelect?.('');
                  onObjectSelect?.({});
                }
              }}
              className="border-gray-50 text-gray-600 bg-gray-200 min-w-[120px] flex-grow border-none bg-transparent text-sm outline-none focus:outline-none"
              value={inputValue}
              onChange={(e) => !isLocked && setInputValue(e.target.value)}
              disabled={isLocked}
              readOnly={isLocked}
              placeholder={internalValue.length ? '' : placeholder}
            />
          </div>
        ) : (
          <div className="relative">
            <input
              id={id}
              name={id}
              type="text"
              autoComplete="off"
              ref={inputRef}
              value={inputValue || internalValue?.label || ''}
              onChange={(e) => !isLocked && setInputValue(e.target.value)}
              onFocus={() => !isLocked && setShowDropdown(true)}
              placeholder={placeholder}
              disabled={isLocked}
              readOnly={isLocked}
              className={`w-full rounded border border-gray-50 text-gray-600 bg-gray-100 px-3 py-1.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-70 ${error ? "border-red-400 text-red-600" : "border-gray-50 text-gray-600"}`}
            />
            {internalValue && !isLocked && (
              <button type="button" onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-red-500">
                &times;
              </button>
            )}
          </div>
        )}

        {showDropdown && !isLocked && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 border-gray-300 border bg-white shadow-lg rounded-md text-sm" >
            <div className="flex pr-2 pt-1 bg-blue-50 p-2 h-10 rounded-md align-center justify-between">
              {loading ? (
                <div className="p-3 text-sm text-gray-500">Loading...</div>
              ) : (
                <button onClick={handleRefresh} className="hover:underline text-blue-600">Refresh List</button>
              )}
              {/* {allowAddNew && (
                <button
                  onClick={() => {if(config.type==="category"){handleNew({is_parent:'no',short:true,form_label:placeholder,parent_id:filteredOptions[0].original?.parent_id})}else{
                    handleNew({});
                  } }}
                  className="hover:underline text-blue-600"
                >
                  + Add New {label}
                </button>
              )} */}
              {/* {allowAddNew && typeof addNewFunction === "function" && (
                <button type="button" onClick={handleAddNew} className="hover:underline text-blue-600">
                  + Add New {label || field.label || "Item"}
                </button>
              )} */}
            </div>
            {filteredOptions.length ? (
              <List ref={listRef} height={200} itemCount={filteredOptions.length} onScroll={handleScroll} itemSize={44} width="100%">{Row}</List>
            ) : (
              <div className="px-4 py-5 text-sm text-gray-500">
                No options found.
                {allowAddNew && typeof addNewFunction === "function" && (
                  <button type="button" onClick={handleAddNew} className="ml-2 font-medium text-blue-600 hover:underline">
                    Add New {label || field.label || "Item"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <ValidationError error={error} />
      )}
    </div>
  );
};
export default SmartSelectInput;
