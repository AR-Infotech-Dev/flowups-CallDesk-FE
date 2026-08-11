import { Plus } from "lucide-react";
import QuotationItemRow from "./QuotationItemRow";

function QuotationItemsSection({ items = [], errors = {}, onAdd, onChange, onProductSelect, onRemove }) {
  const canRemove = items.length > 1;

  return (
    <>
      <div className="quotation-items-title">
        <strong>Products / Services</strong>
        <button type="button" onClick={onAdd}>
          <Plus size={14} /> Add Product
        </button>
      </div>

      <div className="quotation-items-scroll">
        <table className="quotation-items-table overflow-y-hidden">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Discount %</th>
              <th>GST %</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <QuotationItemRow
                key={`${item.product_id || "custom"}-${index}`}
                item={item}
                index={index}
                errors={errors}
                canRemove={canRemove}
                onChange={onChange}
                onProductSelect={onProductSelect}
                onRemove={onRemove}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default QuotationItemsSection;
