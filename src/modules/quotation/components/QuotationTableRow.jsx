function QuotationTableRow({ row, index, columns, table, onPreview }) {
  const rowKey = table.getRowIdentifier(row) ?? row?.quotation_id ?? index;
  const isRevisedCopy = String(row?.is_revised_copy || "").toLowerCase() === "yes";

  const handleRowClick = (event) => {
    if (event.target.closest("button, input, a, select, textarea, [role='button']")) return;
    onPreview?.(row);
  };

  return (
    <tr
      key={rowKey}
      className={`group quotation-table-row ${isRevisedCopy ? "quotation-table-row-revised" : ""}`.trim()}
      onClick={handleRowClick}
    >
      {columns.map((column) => (
        <td
          key={column.key}
          className={`${column.className || ""} ${column.isActionsColumn ? "table-actions-cell" : ""}`.trim()}
          style={table.getCellStyle(column)}
        >
          {column.isActionsColumn
            ? table.renderActionCell(row, index)
            : table.renderCell(column, row, index)}
        </td>
      ))}
      <td />
    </tr>
  );
}

export default QuotationTableRow;
