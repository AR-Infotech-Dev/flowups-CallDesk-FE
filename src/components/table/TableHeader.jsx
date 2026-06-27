import { useMemo, useRef } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus } from "lucide-react";

function getSafeWidth(value, fallback = 80) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function TableHeader({
  columns,
  onResize,
  sortConfig,
  onSortChange,
  allRowsSelected = false,
  onToggleAllRows,
  setIsColumnMenuOpen
}) {
  const resizeStateRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!resizeStateRef.current) {
      return;
    }

    const { key, startX, startWidth, minWidth } = resizeStateRef.current;
    const delta = event.clientX - startX;
    
    onResize(key, Math.max(minWidth, startWidth + delta));
  };

  const stopResize = () => {
    resizeStateRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResize);
  };

  const startResize = (event, column) => {
    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      key: column.key,
      startX: event.clientX,
      startWidth: getSafeWidth(column.currentWidth),
      minWidth: getSafeWidth(column.minWidth, 60),
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResize);
  };

  const lastColumnKey = useMemo(
    () => columns[columns.length - 1]?.key,
    [columns]
  );

  const getSortIcon = (columnKey) => {
    if (sortConfig?.key !== columnKey) {
      return <ChevronsUpDown size={13} />;
    }

    return sortConfig?.direction === "asc"
      ? <ArrowUp size={13} />
      : <ArrowDown size={13} />;
  };

  return (
    <thead className="premium-table-header">
      <tr>
        {columns.map((column) => {
          const columnWidth = getSafeWidth(column.currentWidth);

          return (
            <th
              key={column.key}
              className={`${column.className || ""} ${column.resizable === false ? "" : "is-resizable"} ${sortConfig?.key === column.key ? "is-sorted" : ""}`}
              style={{ width: columnWidth, minWidth: columnWidth, maxWidth: columnWidth }}
            >
            {column.checkbox ? (
              <input
                type="checkbox"
                checked={allRowsSelected}
                onChange={(event) => onToggleAllRows?.(event.target.checked)}
              />
            ) : column.isActionsColumn ? (
              <div className="table-header-shell table-actions-header">
                <span className="table-header-label table-header-label-static">
                  <span className="table-header-text">{column.label}</span>
                </span>
              </div>
            ) : column.className === "icon-col" ? null : (
              <div className="table-header-shell">
                <button
                  type="button"
                  className="table-header-label"
                  onClick={() => onSortChange?.(column.key)}
                >
                  <span className="table-header-text">{column.label}</span>
                  <span className={`table-header-sort ${sortConfig?.key === column.key ? "is-active" : ""}`}>
                    {getSortIcon(column.key)}
                  </span>
                </button>
              </div>
            )}
            {column.resizable === false ? null : (
              <span
                className="table-resize-handle"
                onMouseDown={(event) => startResize(event, column)}
              />
            )}
            </th>
          );
        })}
        <th className="table-column-picker-header">
          <div className="table-column-picker">
            <button
              type="button"
              className="table-column-picker-trigger"
              onClick={(event) => {
                event.stopPropagation();
                setIsColumnMenuOpen((current) => !current);
              }}
            >
              <Plus className={'animate-pulse'} size={10} />
              {/* <span>Add</span> */}
            </button>

          </div>
        </th>
      </tr>
    </thead>
  );
}

export default TableHeader;
