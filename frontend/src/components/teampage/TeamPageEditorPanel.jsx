import { useState } from 'react';
import { MODULE_REGISTRY } from './moduleRegistry';
import { Plus, Palette, Save, X } from 'lucide-react';

const uuidv4 = () => crypto.randomUUID();

const THEMES = [
  { key: 'default', label: 'Claro',    bg: 'bg-white',        ring: 'ring-slate-200' },
  { key: 'dark',    label: 'Oscuro',   bg: 'bg-slate-900',    ring: 'ring-slate-700' },
  { key: 'tech',    label: 'Tech',     bg: 'bg-blue-950',     ring: 'ring-blue-700' },
  { key: 'minimal', label: 'Minimal',  bg: 'bg-slate-50',     ring: 'ring-slate-100' },
  { key: 'vibrant', label: 'Vibrante', bg: 'bg-gradient-to-br from-purple-900 to-blue-900', ring: 'ring-purple-600' }
];

const ACCENT_PRESETS = [
  '#2563eb', '#16a34a', '#dc2626', '#d97706',
  '#7c3aed', '#0891b2', '#db2777', '#059669'
];

export default function TeamPageEditorPanel({
  layout,
  theme,
  accentColor,
  onAddModule,
  onThemeChange,
  onAccentChange,
  onSave,
  saving,
  isEditing,
  onToggleEdit,
  teamDomain,
  teamSlug
}) {
  const [activeTab, setActiveTab] = useState('modules');
  const [search, setSearch] = useState('');

  const filtered = Object.entries(MODULE_REGISTRY).filter(([key, meta]) =>
    meta.label.toLowerCase().includes(search.toLowerCase()) ||
    meta.description.toLowerCase().includes(search.toLowerCase())
  );

  const addModule = (type) => {
    const meta = MODULE_REGISTRY[type];
    onAddModule({
      id: uuidv4(),
      type,
      col: 0,
      row: layout.length,
      w: meta.defaultW || 12,
      h: meta.defaultH || 1,
      config: { ...meta.defaultConfig }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 rounded-l-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Editor de página</h2>
          {teamSlug && teamDomain && (
            <a
              href={`http://${teamSlug}.${teamDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline truncate block max-w-[160px]"
            >
              {teamSlug}.{teamDomain}
            </a>
          )}
        </div>
        <button onClick={onToggleEdit} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Save + Preview */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        {[
          { key: 'modules', label: '🧩 Módulos' },
          { key: 'design',  label: '🎨 Diseño' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'modules' && (
          <div className="p-3 space-y-2">
            <input
              type="text"
              placeholder="Buscar módulos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <p className="text-xs text-slate-400 px-1 pt-1">Haz clic para añadir al final</p>

            <div className="space-y-1.5">
              {filtered.map(([key, meta]) => {
                const alreadyAdded = layout.some(m => m.type === key);
                return (
                  <button
                    key={key}
                    onClick={() => addModule(key)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-left group"
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{meta.label}</p>
                        {alreadyAdded && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">en página</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{meta.description}</p>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-blue-500 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="p-3 space-y-5">
            {/* Theme */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Palette className="h-3.5 w-3.5" /> Tema
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {THEMES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => onThemeChange(t.key)}
                    className={`h-10 rounded-xl ${t.bg} border-2 text-xs font-semibold transition-all ${
                      theme === t.key ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent hover:border-slate-300'
                    }`}
                    style={{ color: t.key === 'default' || t.key === 'minimal' ? '#475569' : '#fff' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Color de acento</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map(color => (
                  <button
                    key={color}
                    onClick={() => onAccentChange(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      accentColor === color ? 'border-slate-800 dark:border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-slate-500">Personalizado:</label>
                <input
                  type="color"
                  value={accentColor || '#2563eb'}
                  onChange={e => onAccentChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Current layout summary */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Módulos activos ({layout.length})</p>
              <div className="space-y-1">
                {layout.map((m, i) => {
                  const meta = MODULE_REGISTRY[m.type] || {};
                  return (
                    <div key={m.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 py-1">
                      <span className="text-slate-400 w-4 text-right">{i + 1}.</span>
                      <span>{meta.icon}</span>
                      <span>{meta.label || m.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
