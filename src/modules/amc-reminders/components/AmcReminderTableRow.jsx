import { renderAmcReminderCell } from "./AmcReminderTableCell";
import { getAmcReminderRowIdentifier } from "../utils/amcReimders.utils";

function AmcReminderTableRow({ row, index, columns, actions }) {
  return (
    <tr key={getAmcReminderRowIdentifier(row, index)} className="group">
      {columns.map((column) => (
        <td
          key={column.key}
          className={column.key === "actions" ? "amc-action-cell" : column.className || ""}
          style={{
            width: column.currentWidth,
            minWidth: column.currentWidth,
            maxWidth: column.currentWidth,
          }}
        >
          {renderAmcReminderCell(column, row, actions)}
        </td>
      ))}
    </tr>
  );
}

export default AmcReminderTableRow;
