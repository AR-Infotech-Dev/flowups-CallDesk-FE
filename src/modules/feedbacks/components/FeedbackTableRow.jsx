import Ratings from "@/components/ui/Ratings";

function FeedbackTableRow({ row, index, columns, table }) {
  const rowKey = table.getRowIdentifier(row) ?? row?.name ?? index;

  return (
    <tr key={rowKey} className="group h-10">
      {columns.map((column) => (
        <td key={column.key} className={`${column.className || ""} ${column.isActionsColumn ? "table-actions-cell" : ""}`.trim()} style={table.getCellStyle(column)} onClick={table.getRowClick(column, row) } >
          {
            column.isActionsColumn
              ? null
              : column.key === "rating"
                ? <Ratings ratings={row[column.key]} showValue />
                : column.key === "ticket_id"
                  ? <span className="font-medium text-slate-700">{row.ticket_no || row.ticket_id || "-"}</span>
                : table.renderCell(column, row, index)
          }
        </td>
      ))}
    </tr>
  );
}

export default FeedbackTableRow;
