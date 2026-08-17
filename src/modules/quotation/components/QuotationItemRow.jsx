import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SmartSelectInput from "@formInputs/smartSelectInput";
import { calculateLine, formatMoney } from "../utils/quotations.utils";
import TextArea from "@/components/form-inputs/TextArea";

const productSelectConfig = {
  type: "product",
  source: "products",
  list: "product_id,product_name,rate,gst_rate,product_description",
  check: "product_name",
  placeholder: "Select Product",
  // statusCheck: "active",
  isCompanyWise: true,
  preload: true,
  cache: false,
  dropdownPortal: true,
  multi: false,
  getValue: (item) => item.product_id,
  getLabel: (item) => item.product_name,
};

function QuotationItemRow({ item, index, errors = {}, canRemove, onChange, onProductSelect, onRemove }) {
  const line = calculateLine(item);
  const productError = errors[`item_${index}_product_id`] || errors[`item_${index}_product_name`];
  const productConfig = useMemo(() => item.product_id && item.product_name
    ? ({
      ...productSelectConfig,
      selectedOption: {
        value: item.product_id,
        label: item.product_name,
        original: item,
      },
    })
    : productSelectConfig, [item.product_id, item.product_name]);


  return (
    <tr>
      <td className="p-3!">{index + 1}</td>
      <td className="quotation-product-cell">
        <div>
          <SmartSelectInput
            id={`quotation_product_${index}`}
            field={{ name: `quotation_product_${index}` }}
            value={item.product_id || ""}
            config={productConfig}
            error={productError}
            onSelect={(value) => onChange(index, "product_id", value)}
            onObjectSelect={(option) => onProductSelect(index, option)}
          />
          <TextArea
            field={{ name: "product_description", label: "", type: "textarea", rows: 3, placeholder: "Enter product description" }}
            onChange={(event) => {
              onChange(index, "product_description", event.target.value);
            }}
            value={item.product_description || ""}
            className={'text-[10px]! overflow-hidden text-gray-500! border-gray-200! mt-1'}
          />
        </div>
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
      <td className="pt-3!"><b>{formatMoney(line.total)}</b></td>
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
