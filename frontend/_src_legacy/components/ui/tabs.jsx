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
    <div className={`inline-flex items-center justify-center bg-stone-100 dark:bg-stone-800 p-1 text-stone-600 dark:text-stone-400 ${className}`.trim()}>
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
        'px-3 py-2 text-sm font-medium transition-colors',
        isActive ? 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100' : 'hover:text-stone-900 dark:hover:text-stone-100',
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
