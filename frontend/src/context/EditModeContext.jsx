/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const EditModeContext = createContext(null);

export const EditModeProvider = ({ children }) => {
  const [editMode, setEditMode] = useState(false);
  const toggleEditMode = useCallback(() => setEditMode(m => !m), []);
  const disableEditMode = useCallback(() => setEditMode(false), []);
  const value = useMemo(() => ({ editMode, toggleEditMode, disableEditMode }), [editMode, toggleEditMode, disableEditMode]);
  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
};

export const useEditMode = () => {
  const ctx = useContext(EditModeContext);
  if (!ctx) throw new Error('useEditMode must be used within EditModeProvider');
  return ctx;
};
