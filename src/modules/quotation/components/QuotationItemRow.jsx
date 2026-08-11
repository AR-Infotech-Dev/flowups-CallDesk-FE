import { Trash2 } from "lucide-react";
import SmartSelectInput from "@formInputs/smartSelectInput";
import { calculateLine, formatMoney } from "../utils/quotations.utils";

const productSelectConfig = {
  type: "product",
  source: "products",
  list: "product_id,product_name,rate,gst_rate",
  check: "product_name",
  placeholder: "Select Product",
  // statusCheck: "active",
  preload: true,
  cache: true,
  dropdownPortal: true,
  multi: false,
  getValue: (item) => item.product_id,
  getLabel: (item) => item.product_name,
};

function QuotationItemRow({ item, index, errors = {}, canRemove, onChange, onProductSelect, onRemove }) {
  const line = calculateLine(item);
  const productError = errors[`item_${index}_product_id`] || errors[`item_${index}_product_name`];

  return (
    <tr>
      <td>{index + 1}</td>
      <td className="quotation-product-cell">
        <SmartSelectInput
          id={`quotation_product_${index}`}
          field={{ name: `quotation_product_${index}` }}
          value={item.product_id || ""}
          config={productSelectConfig}
          error={productError}
          onSelect={(value) => onChange(index, "product_id", value)}
          onObjectSelect={(option) => onProductSelect(index, option)}
        />
      </td>
      <td>
        <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => onChange(index, "quantity", event.target.value)} />
      </td>
      <td>
        <input type="number" min="0" step="0.01" value={item.rate} onChange={(event) => onChange(index, "rate", event.target.value)} />
      </td>
      <td>
        <input type="number" min="0" max="100" value={item.discount_rate} onChange={(event) => onChange(index, "discount_rate", event.target.value)} />
      </td>
      <td>
        <input type="number" min="0" max="100" value={item.gst_rate} onChange={(event) => onChange(index, "gst_rate", event.target.value)} />
      </td>
      <td><b>{formatMoney(line.total)}</b></td>
      <td>
        <button
          className="quotation-remove-item"
          disabled={!canRemove}
          onClick={() => onRemove(index)}
          type="button"
          title="Remove product"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

export default QuotationItemRow;
