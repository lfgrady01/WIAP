import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Initiative, Role, Permission, Screen, DecisionLogEntry } from './types';

interface AppState {
  initiatives: Initiative[];
  role: Role;
  permission: Permission;
  currentScreen: Screen;
  selectedInitiativeId: string | null;
  toast: string | null;
  capacityAvailable: { ba: number; dev: number; pm: number; ops: number };
  decisionLog: DecisionLogEntry[];
}

interface AppActions {
  setRole: (role: Role) => void;
  setPermission: (permission: Permission) => void;
  navigateTo: (screen: Screen) => void;
  openDrawer: (id: string) => void;
  closeDrawer: () => void;
  addInitiative: (initiative: Initiative) => void;
  updateInitiative: (id: string, updates: Partial<Initiative>) => void;
  showToast: (message: string) => void;
  setCapacityAvailable: (capacity: { ba: number; dev: number; pm: number; ops: number }) => void;
  addDecision: (entry: DecisionLogEntry) => void;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [role, setRoleState] = useState<Role>('Portfolio Delivery');
  const [permission, setPermission] = useState<Permission>('Reviewer');
  const [currentScreen, setCurrentScreen] = useState<Screen>('portfolio');
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [capacityAvailable, setCapAvail] = useState({ ba: 0, dev: 0, pm: 0, ops: 0 });
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([]);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    setCurrentScreen('portfolio');
    setSelectedInitiativeId(null);
  }, []);

  const navigateTo = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
    setSelectedInitiativeId(null);
  }, []);

  const openDrawer = useCallback((id: string) => setSelectedInitiativeId(id), []);
  const closeDrawer = useCallback(() => setSelectedInitiativeId(null), []);

  const addInitiative = useCallback((initiative: Initiative) => {
    setInitiatives(prev => [...prev, initiative]);
  }, []);

  const updateInitiative = useCallback((id: string, updates: Partial<Initiative>) => {
    setInitiatives(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const showToast = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const setCapacityAvailable = useCallback(
    (cap: { ba: number; dev: number; pm: number; ops: number }) => setCapAvail(cap),
    [],
  );

  const addDecision = useCallback(
    (entry: DecisionLogEntry) => setDecisionLog(prev => [entry, ...prev]),
    [],
  );

  return (
    <AppContext.Provider
      value={{
        initiatives,
        role,
        permission,
        currentScreen,
        selectedInitiativeId,
        toast,
        capacityAvailable,
        decisionLog,
        setRole,
        setPermission,
        navigateTo,
        openDrawer,
        closeDrawer,
        addInitiative,
        updateInitiative,
        showToast,
        setCapacityAvailable,
        addDecision,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
