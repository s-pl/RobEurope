/**
 * CountrySelect — a searchable country picker built with a custom popover.
 *
 * Props:
 *   value        {string}   - Current value ("all" or country id as string)
 *   onValueChange {Function} - Called with the new value string
 *   countries    {Array}    - Array of { id, name } objects from useCountries
 *   loading      {boolean}  - Show loading skeleton while countries fetch
 *   allLabel     {string}   - Label for the "all countries" option (default: "All countries")
 *   placeholder  {string}   - Search input placeholder
 *   disabled     {boolean}
 *   className    {string}
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X, Globe } from 'lucide-react';

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

  // Close on outside click
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

  // Focus input when dropdown opens
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
        className={`flex items-center justify-between w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-900 transition-colors
          ${open
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          text-slate-700 dark:text-slate-200`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{loading ? '...' : displayLabel}</span>
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="shrink-0 ml-1"
        >
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute z-50 mt-1.5 w-full min-w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
            style={{ maxHeight: '280px', display: 'flex', flexDirection: 'column' }}
          >
            {/* Search input */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-8 pr-7 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto flex-1">
              {/* All countries option */}
              <button
                type="button"
                onClick={() => handleSelect('all')}
                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                  value === 'all'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {allLabel}
              </button>

              {/* Divider */}
              <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2" />

              {/* Country options */}
              {filtered.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">{search ? 'No results' : 'No countries'}</p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(String(c.id))}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      String(c.id) === String(value)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountrySelect;
