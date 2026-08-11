function LeadTableRow({ row, index, columns, table }) {
  const rowKey = table.getRowIdentifier(row) ?? row?.lead_id ?? index;
  return <tr key={rowKey} className="group">
    {columns.map((column) => <td key={column.key} className={`${column.className || ""} ${column.isActionsColumn ? "table-actions-cell" : ""}`.trim()} style={table.getCellStyle(column)} onClick={table.getRowClick(column, row)}>
      {column.isActionsColumn ? table.renderActionCell(row, index) : table.renderCell(column, row, index)}
    </td>)}
    <td />
  </tr>;
}
export default LeadTableRow;
