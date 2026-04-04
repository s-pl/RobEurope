'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
}

interface AdminDataTableProps<T extends Record<string, any>> {
  data: T[]
  columns: Column<T>[]
  searchKey?: string
  searchPlaceholder?: string
  emptyText?: string
  actions?: (item: T) => React.ReactNode
}

export default function AdminDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey = 'name',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Sin resultados',
  actions,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState('')

  const filtered = data.filter((item) =>
    !search ||
    String(item[searchKey] ?? '')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold label-caps text-stone-500 dark:text-stone-400"
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold label-caps text-stone-500 dark:text-stone-400">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-stone-400 dark:text-stone-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              filtered.map((item, i) => (
                <tr key={item.id ?? i} className="bg-white dark:bg-stone-950 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-stone-700 dark:text-stone-300">
                      {col.render ? col.render(item) : String(item[col.key] ?? '—')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">{actions(item)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
