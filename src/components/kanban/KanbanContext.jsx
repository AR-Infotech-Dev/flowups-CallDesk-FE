import { createContext, useContext } from "react";

const KanbanContext = createContext({
  config: {},
  editRow: undefined,
  menuId: undefined,
});

export function KanbanProvider({ value, children }) {
  return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>;
}

export function useKanbanContext() {
  return useContext(KanbanContext);
}
