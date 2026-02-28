import { useState } from 'react';

export default function AboutModule({ team, config = {}, isEditing, onConfigChange, accentColor }) {
  const accent = accentColor || '#2563eb';
  // In edit mode, use config.content; in view mode, fall back to team description
  const content = config.content || team?.description || '';

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-100" style={{ color: accent }}>
            💬 Sobre nosotros
          </h3>
        </div>
        <div className="p-4">
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Escribe sobre tu equipo..."
            value={config.content || ''}
            onChange={(e) => onConfigChange?.({ ...config, content: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-400">Este texto se mostrará en la página pública del equipo.</p>
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
        <span style={{ color: accent }}>💬</span>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Sobre nosotros</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}
