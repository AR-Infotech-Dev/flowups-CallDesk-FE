import { isAmcActive } from "@utils/amc";

function TicketTableRow({ row, index, columns, table }) {
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
          {column.isActionsColumn
            ? table.renderActionCell(row, index)
            : table.renderCell(column, row, index)}
        </td>
      ))}
      <td></td>
    </tr>
  );
}

export default TicketTableRow;
