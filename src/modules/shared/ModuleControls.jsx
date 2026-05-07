import {
  CirclePlus,
  Trash2,
  Eye,
  Filter,
  MoreHorizontal,
  Settings2,
  Upload,
  RefreshCcw
} from "lucide-react";
import ActionButton from "../../components/ui/ActionButton";
import Spinner from "../../components/ui/Spinner";
function ModuleControls({
  loading,
  onCreate,
  onRefresh,
  onDeleteSelected,
  showDelete,
  deleteDisabled,
  deleteLabel = "Delete Selected",
  deleting,
  selectedLabel = "4 Selected",
  resultsLabel = "120 Results",
  createLabel = "Add New",
  filter,
  children,
  showTraditional = true,
  canCreate = true,
  canDelete = true
}) {
  return (
    <div className="module-controls">
      <div className="module-toolbar-row">
        <div className="module-toolbar-left">
          {filter}
          {/* <ActionButton variant="ghostPrimary">
            <CirclePlus size={16} />
            Update
          </ActionButton>
          <ActionButton>{selectedLabel}</ActionButton> */}
          {/* <ActionButton>
            <Filter size={15} />
            Filter
            <span className="pill">4</span>
          </ActionButton> */}
          {/* <ActionButton>
            <Settings2 size={15} />
            Filters
          </ActionButton> */}
          {/* <span className="results-text">{resultsLabel}</span> */}
        </div>

        <div className="module-toolbar-right">
          {showTraditional &&
            <>
              {/* Add button is shown only when the user has add permission for this module. */}
              {canCreate && <ActionButton variant="primary" onClick={onCreate}> <CirclePlus size={16} /> {createLabel} </ActionButton>}
              <ActionButton onClick={onRefresh}> {loading ? <Spinner /> : <RefreshCcw size={15} color="var(--primary)" />} </ActionButton>
              {/* Delete button is shown only when delete permission exists and rows are selected. */}
              {canDelete && showDelete &&
                <ActionButton onClick={onDeleteSelected} disabled={deleteDisabled}>
                  {deleting ? <Spinner /> : <Trash2 size={15} color="var(--primary)" />}
                  {/* {deleteLabel} */}
                </ActionButton>
              }
            </>
          }
          {children}
        </div>
      </div>
    </div>
  );
}

export default ModuleControls;
