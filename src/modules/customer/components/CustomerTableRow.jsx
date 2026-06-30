import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import moment from "moment";
import { isAmcActive } from "@utils/amc";

function parseCustomerProducts(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return [value];

  if (typeof value === "string") {
    try {
      const parsedValue = JSON.parse(value);
      if (Array.isArray(parsedValue)) return parsedValue;
      if (parsedValue && typeof parsedValue === "object") return [parsedValue];
    } catch {
      return [];
    }
  }

  return [];
}

function formatProductDate(value) {
  if (!value) return "";

  const parsedDate = moment(value, [moment.ISO_8601, "YYYY-MM-DD", "DD-MM-YYYY"]);
  return parsedDate.isValid() ? parsedDate.format("DD MMM YYYY") : value;
}

function ProductDetailList({ products }) {
  return (
    <div className="customer-products-popover-list">
      {products.map((product, index) => {
        const addOns = Array.isArray(product?.add_ons)
          ? product.add_ons.filter(Boolean).join(", ")
          : product?.add_ons || "";
        const expiryDate = formatProductDate(product?.expiry_date);

        return (
          <div className="customer-products-popover-item" key={`${product?.product_id || index}-${product?.serial_number || index}`}>
            <div>
              <strong>{product?.product_name || "-"}</strong>
              {expiryDate ? <small>{expiryDate}</small> : null}
            </div>
            <span>{product?.serial_number ? `SN ${product.serial_number}` : "No serial"}</span>
            {addOns ? <span>{addOns}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function CustomerProductsCell({ value }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const moreButtonRef = useRef(null);
  const popoverRef = useRef(null);
  const products = parseCustomerProducts(value);

  if (!products.length) {
    return "-";
  }

  const [primaryProduct, ...remainingProducts] = products;
  const addOns = Array.isArray(primaryProduct?.add_ons)
    ? primaryProduct.add_ons.filter(Boolean).join(", ")
    : primaryProduct?.add_ons || "";
  const expiryDate = formatProductDate(primaryProduct?.expiry_date);
  const productSummary = products
    .map((product) => {
      const serial = product?.serial_number ? `SN ${product.serial_number}` : "No serial";
      const expiry = product?.expiry_date ? `Exp ${formatProductDate(product.expiry_date)}` : "";
      return [product?.product_name || "-", serial, expiry].filter(Boolean).join(" | ");
    })
    .join("\n");

  const updatePopoverPosition = () => {
    const button = moreButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    const left = Math.min(
      Math.max(12, rect.right - width),
      window.innerWidth - width - 12
    );

    setPopoverPosition({
      top: rect.bottom + 6,
      left,
    });
  };

  useEffect(() => {
    if (!isPopoverOpen) return;

    updatePopoverPosition();

    const handlePointerDown = (event) => {
      if (
        moreButtonRef.current?.contains(event.target) ||
        popoverRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsPopoverOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsPopoverOpen(false);
      }
    };

    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isPopoverOpen]);

  return (
    <div className="customer-products-cell customer-products-summary" title={productSummary}>
      <div className="customer-product-item">
        <div className="customer-product-head">
          <strong>{primaryProduct?.product_name || "-"}</strong>
          {expiryDate ? <small>{expiryDate}</small> : null}
        </div>
        <div className="customer-product-meta">
          <span>{primaryProduct?.serial_number ? `SN ${primaryProduct.serial_number}` : "No serial"}</span>
          {addOns ? <span>{addOns}</span> : null}
        </div>
      </div>
      {remainingProducts.length ? (
        <span className="customer-products-more-wrap">
          <button
            ref={moreButtonRef}
            type="button"
            className="customer-products-more"
            onClick={(event) => {
              event.stopPropagation();
              updatePopoverPosition();
              setIsPopoverOpen((current) => !current);
            }}
          >
            +{remainingProducts.length} more
          </button>
          {isPopoverOpen
            ? createPortal(
              <div
                ref={popoverRef}
                className="customer-products-popover"
                style={{
                  top: popoverPosition.top,
                  left: popoverPosition.left,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="customer-products-popover-head">
                  <strong>Products</strong>
                  <button type="button" onClick={() => setIsPopoverOpen(false)}>Close</button>
                </div>
                <ProductDetailList products={products} />
              </div>,
              document.body
            )
            : null}
        </span>
      ) : null}
    </div>
  );
}

function CustomerTableRow({ row, index, columns, table }) {
  const rowKey = table.getRowIdentifier(row) ?? row?.name ?? index;
  const activeAmc = isAmcActive(row);

  return (
    <tr key={rowKey} className={`group ${activeAmc ? "table-row-amc-active" : ""}`}>
      {columns.map((column) => (
        <td
          key={column.key}
          className={`${column.className || ""} ${column.isActionsColumn ? "table-actions-cell" : ""}`.trim()}
          style={table.getCellStyle(column)}
          onClick={table.getRowClick(column, row)}
        >
          {column.isActionsColumn ? (
            table.renderActionCell(row, index)
          ) : column.key === "customer_products" ? (
            <CustomerProductsCell value={row?.customer_products} />
          ) : (
            table.renderCell(column, row, index)
          )}
        </td>
      ))}
      <td></td>
    </tr>
  );
}

export default CustomerTableRow;
