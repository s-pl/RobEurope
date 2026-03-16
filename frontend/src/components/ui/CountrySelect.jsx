/**
 * CountrySelect — a searchable country picker with refined dropdown.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X, Globe, Check } from 'lucide-react';

export const CountrySelect = ({
  value = 'all',
  onValueChange,
  countries = [],
  loading = false,
  allLabel = 'All countries',
  placeholder = 'Search...',
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return countries;
    return countries.filter(c => c.name.toLowerCase().includes(q));
  }, [countries, search]);

  const selected = value === 'all' ? null : countries.find(c => String(c.id) === String(value));
  const displayLabel = selected ? selected.name : allLabel;

  const handleSelect = (val) => {
    onValueChange(val);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen(v => !v)}
        className={`
          flex items-center justify-between w-full rounded-lg border px-3.5 py-2.5 text-sm
          bg-white dark:bg-stone-950 transition-all duration-150
          ${open
            ? 'border-stone-900 ring-1 ring-stone-900 dark:border-stone-400 dark:ring-stone-400'
            : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600'}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          text-stone-900 dark:text-stone-50
        `}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Globe className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
          <span className="truncate">{loading ? '...' : displayLabel}</span>
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="shrink-0 ml-2"
        >
          <ChevronDown className="h-4 w-4 text-stone-400" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute z-50 mt-1.5 w-full min-w-[200px] bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl shadow-stone-900/8 dark:shadow-stone-950/40 overflow-hidden"
            style={{ maxHeight: '300px', display: 'flex', flexDirection: 'column' }}
          >
            {/* Search */}
            <div className="p-2 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-8 pr-8 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 dark:focus:ring-stone-400 dark:focus:border-stone-400 text-stone-900 dark:text-stone-50 placeholder:text-stone-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="overflow-y-auto flex-1 py-1">
              {/* All option */}
              <button
                type="button"
                onClick={() => handleSelect('all')}
                className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                  value === 'all'
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50 font-medium'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Globe className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  {allLabel}
                </span>
                {value === 'all' && <Check className="h-3.5 w-3.5 text-stone-900 dark:text-stone-50 shrink-0" />}
              </button>

              <div className="h-px bg-stone-100 dark:bg-stone-800 mx-2 my-1" />

              {/* Country list */}
              {filtered.length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-6">{search ? 'No results' : 'No countries'}</p>
              ) : (
                filtered.map(c => {
                  const isSelected = String(c.id) === String(value);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelect(String(c.id))}
                      className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50 font-medium'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-stone-900 dark:text-stone-50 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountrySelect;
