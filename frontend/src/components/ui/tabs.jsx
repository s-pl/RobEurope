import React, { createContext, useContext, useMemo, useState } from 'react';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className = '', children }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const api = useMemo(() => ({
    value,
    setValue: (v) => {
      setInternalValue(v);
      onValueChange?.(v);
    }
  }), [value, onValueChange]);

  return (
    <TabsContext.Provider value={api}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children }) {
  return (
    <div className={`inline-flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 p-1 text-slate-600 dark:text-slate-400 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className = '', children }) {
  const api = useContext(TabsContext);
  const isActive = api?.value === value;
  return (
    <button
      type="button"
      onClick={() => api?.setValue(value)}
      className={[
        'px-3 py-2 text-sm font-medium rounded-md transition-colors',
        isActive ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow' : 'hover:text-slate-900 dark:hover:text-slate-100',
        className
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = '', children }) {
  const api = useContext(TabsContext);
  if (api?.value !== value) return null;
  return (
    <div className={className}>{children}</div>
  );
}
