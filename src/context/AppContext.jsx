import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { dashboardReducer, getKpis, getReminders, hydrateState, serializeState, STORAGE_KEY } from "../lib/dashboard";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, undefined, hydrateState);
  const stateRef = useRef(state);
  const kpis = useMemo(() => getKpis(state), [state]);
  const reminders = useMemo(() => getReminders(state), [state]);

  useEffect(() => {
    stateRef.current = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch {
      // Demo storage can be full when an admin photo is close to the browser quota.
    }
  }, [state]);

  useEffect(() => () => {
    stateRef.current.complianceRecords.forEach((record) => record.documents.forEach((document) => {
      if (document.objectUrl) URL.revokeObjectURL(document.objectUrl);
    }));
  }, []);

  const value = useMemo(() => ({ state, dispatch, kpis, reminders }), [state, kpis, reminders]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
