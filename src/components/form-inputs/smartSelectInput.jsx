import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FixedSizeList as List } from 'react-window';
import { makeRequest } from "@api/httpClient";
import { API_BASE_URL } from '@api/config';
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
    cacheCreatedOption = true,
    selectedOption = null,
    multi = false,
    getValue,
    getLabel,
    valueKey = "",
    labelKey = "",
    slug = "",
    apiUrl = "",
    countKey = "",
    countLabel = "",
    customURL = "",
    dropdownPortal = false,
    statusCheck = false,
    isCompanyWise = false,
    customParameters = {},
    RowTemp = null,
    rowHeight = 44,
    remoteSearch = true,
    searchDebounceMs = 300,
    minSearchChars = 1,
  } = config;
  // const { openCategoryCreate } = useCategoryCreateStore();
  const key = `${type}-${slug || source}-${apiUrl || customURL}`;
  const [options, setOptions] = useState([]);
  const [internalValue, setInternalValue] = useState(multi ? [] : null);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const listRef = useRef(null);
  const transientOptionRef = useRef(null);
  const requestIdRef = useRef(0);
  const fetchingRef = useRef(false);
  const usesRemoteSearch = type !== 'category' && remoteSearch;
  const effectiveSearchColumns = check || (type === 'customer'
    ? 'name,mobile_no,email,contact_person,customer_products'
    : 'name');
  const getOptionsCacheKey = (searchText = '') => {
    const normalizedSearchText = String(searchText || '').trim().toLowerCase();
    return normalizedSearchText ? `${key}::search::${normalizedSearchText}` : key;
  };

  // Normalize fetched items
  const normalizeOptions = (items = []) => items.map(item => {
    const baseLabel = getLabel
      ? getLabel(item)
      : (labelKey ? item[labelKey] : item.name) || 'Unnamed';
    const count = countKey ? Number(item[countKey] || 0) : null;
    const label = countKey
      ? `${baseLabel} (${count}${countLabel ? ` ${countLabel}` : ""})`
      : baseLabel;

    return {
      value: getValue
        ? getValue(item)
        : (valueKey ? item[valueKey] : item.id),
      label,
      original: item,
    };
  });

  const fetchOptions = async (page = 0, searchText = '', { replace = false } = {}) => {
    const requestId = ++requestIdRef.current;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const headers = {};
      const trimmedSearchText = String(searchText || '').trim();
      let res = {};
      let data = [];

      if (type === 'category') {
        const urlType = customURL || apiUrl || `${API_BASE_URL}/system/searchSlugList`;
        const posData = customURL
          ? customParameters
          : {
            status: customParameters.status || 'active',
            slug: slug || source,
            isCompanyWise,
            ...customParameters,
          };
        res = await makeRequest(urlType, {
          method: 'POST', headers,
          body: posData,
        });
        data = customURL ? res?.data || [] : res?.data?.[0]?.sublist || [];
      } else {
        res = await makeRequest(apiUrl || `${API_BASE_URL}/system/searchList`, {
          method: 'POST', headers,
          body: {
            type: trimmedSearchText ? 'input' : '',
            text: trimmedSearchText,
            system: 'new',
            tableName: type === 'customer' ? 'customer' : source,
            wherec: effectiveSearchColumns,
            status: statusCheck,
            list,
            isCompanyWise,
            curpage: page,
            ...customParameters,
          },
        });
        data = Array.isArray(res?.data) ? res.data : [];
      }

      // Ignore a slower response from an older search request.
      if (requestId !== requestIdRef.current) return [];

      const normalized = normalizeOptions(data);
      setOptions((previous) => {
        if (replace) return normalized;
        const existingIds = new Set(previous.map((item) => String(item.value)));
        const uniqueNew = normalized.filter((item) => !existingIds.has(String(item.value)));
        return [...previous, ...uniqueNew];
      });
      setHasMore(Boolean(res?.loadstate));

      if (cache) cacheStore.set(getOptionsCacheKey(trimmedSearchText), normalized);
      if (showRecent && !trimmedSearchText) {
        localStorage.setItem(`recent_${key}`, JSON.stringify(data.slice(0, 5)));
      }
      return normalized;
    } catch (fetchError) {
      if (requestId === requestIdRef.current) {
        console.error('SmartSelectInput load error:', fetchError);
        if (replace) setOptions([]);
      }
      return [];
    } finally {
      if (requestId === requestIdRef.current) {
        fetchingRef.current = false;
        setLoading(false);
      }
    }
  };

  // Fetch once on mount
  useEffect(() => {
    const cachedOptions = cache ? cacheStore.get(key) : null;
    if (cachedOptions) {
      setOptions(cachedOptions);
      return;
    }

    if (preload || (cache && !usesRemoteSearch)) {
      const recent = localStorage.getItem(`recent_${key}`);
      if (recent) setOptions(normalizeOptions(JSON.parse(recent)));
      else fetchOptions();
    }
  }, []);

  useEffect(() => {
    if (!usesRemoteSearch) return undefined;

    const searchText = String(inputValue || '').trim();
    if (searchText.length < Math.max(1, Number(minSearchChars) || 1)) {
      requestIdRef.current += 1;
      fetchingRef.current = false;
      setLoading(false);
      setOptions(cacheStore.get(key) || []);
      return undefined;
    }

    const cachedOptions = cache ? cacheStore.get(getOptionsCacheKey(searchText)) : null;
    if (cachedOptions) {
      requestIdRef.current += 1;
      fetchingRef.current = false;
      setLoading(false);
      setOptions(cachedOptions);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      fetchOptions(0, searchText, { replace: true });
    }, Math.max(0, Number(searchDebounceMs) || 0));

    return () => window.clearTimeout(timeoutId);
  }, [inputValue, usesRemoteSearch, searchDebounceMs, minSearchChars]);
  const handleScroll = () => {
    const listEl = listRef.current;
    if (!listEl) return;

    const { scrollHeight, clientHeight, scrollTop } = listEl._outerRef;

    // If user scrolled near bottom
    if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !fetchingRef.current) {
      const nextPage = Number(page) + 1;
      setPage(nextPage);
      fetchOptions(nextPage, usesRemoteSearch ? inputValue : '');
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
    };

    if (isCleared) {
      transientOptionRef.current = null;
      setInternalValue(multi ? [] : null);
      return () => { alive = false; };
    }

    const transientOption = transientOptionRef.current;
    if (transientOption && ids.includes(String(transientOption.value))) {
      applyMatch([transientOption]);
      return () => { alive = false; };
    }

    if (selectedOption?.value !== undefined && ids.includes(String(selectedOption.value))) {
      applyMatch([selectedOption]);
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
  }, [value, key, multi, selectedOption]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target) && !dropdownRef.current?.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    if (!showDropdown || !dropdownPortal) return undefined;

    const updateDropdownPosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownPosition({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width,
      });
    };

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [showDropdown, dropdownPortal]);
  const handleSelect = (item) => {
    if (isLocked) return;
    if (transientOptionRef.current && String(transientOptionRef.current.value) !== String(item.value)) {
      transientOptionRef.current = null;
    }

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

    if (cacheCreatedOption) {
      setOptions((current) => {
        const withoutDuplicate = current.filter((existing) => String(existing.value) !== String(option.value));
        const nextOptions = [option, ...withoutDuplicate];
        cacheStore.set(key, nextOptions);
        return nextOptions;
      });
    } else {
      transientOptionRef.current = option;
    }

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

    transientOptionRef.current = null;
    setInternalValue(multi ? [] : null);
    setInputValue(null);
    setShowDropdown(false);
    onSelect?.('');
    onObjectSelect?.({});
  };
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
  const handleRefresh = () => {
    if (isLocked) return;

    const searchText = usesRemoteSearch ? String(inputValue || '').trim() : '';
    const cachePrefix = `${key}::search::`;
    Array.from(cacheStore.keys()).forEach((cacheKey) => {
      if (cacheKey === key || cacheKey.startsWith(cachePrefix)) {
        cacheStore.delete(cacheKey);
      }
    });
    localStorage.removeItem(`recent_${key}`);
    setPage(0);
    setOptions([]);
    fetchOptions(0, searchText, { replace: true });
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

  // Remote results may match fields that are not part of the visible label
  // (for example a product serial number), so do not filter them again locally.
  const filteredOptions = !usesRemoteSearch && inputValue
    ? options.filter(opt =>
      opt.label && opt.label.toLowerCase().includes(inputValue.toLowerCase())
    )
    : options;

  const Row = ({ index, style }) => {
    const item = filteredOptions[index];

    const isSelected = multi
      ? internalValue.some(v => v.value === item.value)
      : internalValue?.value === item.value;
    return (
      RowTemp
        ? (
          <RowTemp
            item={item}
            isSelected={isSelected}
            onClick={() => handleSelect(item)}
            style={style}
          />
        )
        : (
          < div style={style} onClick={() => handleSelect(item)} className={`cursor-pointer px-4 py-2 hover:bg-gray-100 flex items-start justify-between text-sm ${isSelected && "bg-blue-50"}`} >
            <span className="whitespace-normal wrap-break-word">
              {item.label}
            </span>
            {isSelected && <Check size={16} className="text-green-600 ml-2" />}
            {item.original.status && item.original.status != "" && <StatusIndicator status={item.original.status} />}
          </div >
        )
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
                if (!multi && inputValue === '' && !internalValue) {
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

        {showDropdown && !isLocked && (!dropdownPortal || dropdownPosition) && createPortal(
          <div ref={dropdownRef} className={`${dropdownPortal ? "fixed z-1000" : "absolute left-0 right-0 top-full z-50 mt-1"} max-h-60 rounded-sm border border-gray-300 bg-white text-sm shadow-lg`} style={dropdownPortal ? dropdownPosition : undefined} >
            <div className="flex pr-2 pt-1 bg-blue-50 rounded-t-sm p-2 h-10 align-center justify-between">
              {loading
                ? (<div className="p-3 text-sm text-gray-500">Loading...</div>)
                : (<button onClick={handleRefresh} className="hover:underline text-blue-600">Refresh List</button>)
              }
              {allowAddNew && typeof addNewFunction === "function" && (
                <button type="button" onClick={handleAddNew} className="hover:underline text-blue-600"> + Add New  {label || field.label || "Item"} </button>
              )}
            </div>
            {filteredOptions.length
              ? (
                <List
                  ref={listRef}
                  height={200}
                  itemCount={filteredOptions.length}
                  itemKey={(index) => String(filteredOptions[index]?.value ?? index)}
                  onScroll={handleScroll}
                  itemSize={rowHeight}
                  width="100%"
                >
                  {Row}
                </List>
              )
              : (
                <div className="px-4 py-5 text-sm text-gray-500">
                  No options found.
                  {allowAddNew && typeof addNewFunction === "function" && (
                    <button type="button" onClick={handleAddNew} className="ml-2 font-medium text-blue-600 hover:underline">
                      Add New {label || field.label || "Item"}
                    </button>
                  )}
                </div>
              )
            }
          </div>,
          dropdownPortal ? document.body : containerRef.current
        )}
      </div>
      {error && (
        <ValidationError error={error} />
      )}
    </div>
  );
};
export default SmartSelectInput;
