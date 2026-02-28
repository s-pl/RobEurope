import { useState } from 'react';
import { MODULE_REGISTRY } from './moduleRegistry';
import { Plus, Save, X, Palette, LayoutGrid } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Input } from '../ui/input';

const uuidv4 = () => crypto.randomUUID();

const THEMES = [
  { key: 'default', label: 'Claro',   bg: '#ffffff', text: '#374151' },
  { key: 'dark',    label: 'Oscuro',  bg: '#0f172a', text: '#f8fafc' },
  { key: 'minimal', label: 'Minimal', bg: '#fafafa', text: '#374151' },
  { key: 'warm',    label: 'Cálido',  bg: '#fef9f0', text: '#44403c' },
];

const ACCENT_PRESETS = [
  '#18181b', '#2563eb', '#16a34a', '#dc2626',
  '#d97706', '#7c3aed', '#0891b2', '#db2777',
];

function ModuleIcon({ iconName, className }) {
  const Icon = LucideIcons[iconName] || LucideIcons.Box;
  return <Icon className={className} />;
}

export default function TeamPageEditorPanel({
  layout,
  theme,
  accentColor,
  onAddModule,
  onThemeChange,
  onAccentChange,
  onSave,
  saving,
  onToggleEdit,
  teamDomain,
  teamSlug,
}) {
  const [activeTab, setActiveTab] = useState('modules');
  const [search, setSearch]       = useState('');

  const filtered = Object.entries(MODULE_REGISTRY).filter(([, meta]) =>
    meta.label.toLowerCase().includes(search.toLowerCase()) ||
    meta.description.toLowerCase().includes(search.toLowerCase())
  );

  const addModule = (type) => {
    const meta = MODULE_REGISTRY[type];
    onAddModule({
      id:     uuidv4(),
      type,
      col:    0,
      row:    layout.length,
      w:      meta.defaultW || 12,
      h:      meta.defaultH || 1,
      config: { ...meta.defaultConfig },
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Editor de página</p>
          {teamSlug && teamDomain && (
            <a
              href={`https://${teamSlug}.${teamDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-600 truncate block max-w-[160px] transition-colors"
            >
              {teamSlug}.{teamDomain}
            </a>
          )}
        </div>
        <button
          onClick={onToggleEdit}
          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          title="Cerrar editor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Save button */}
      <div className="px-3 py-2.5 border-b border-zinc-100 flex-shrink-0">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 flex-shrink-0">
        {[
          { key: 'modules', label: 'Módulos', Icon: LayoutGrid },
          { key: 'design',  label: 'Diseño',  Icon: Palette    },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === key
                ? 'border-b-2 border-zinc-900 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Modules tab ── */}
        {activeTab === 'modules' && (
          <div className="p-3 space-y-2">
            <Input
              placeholder="Buscar módulo…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-xs"
            />

            <p className="text-[11px] text-zinc-400 px-0.5">Clic para añadir al final</p>

            <div className="space-y-1">
              {filtered.map(([key, meta]) => {
                const inLayout = layout.some(m => m.type === key);
                return (
                  <button
                    key={key}
                    onClick={() => addModule(key)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all text-left group"
                  >
                    <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      <ModuleIcon iconName={meta.icon} className="h-3.5 w-3.5 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-zinc-800">{meta.label}</p>
                        {inLayout && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
                            añadido
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{meta.description}</p>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Design tab ── */}
        {activeTab === 'design' && (
          <div className="p-3 space-y-5">

            {/* Theme */}
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tema de fondo</p>
              <div className="grid grid-cols-2 gap-1.5">
                {THEMES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => onThemeChange(t.key)}
                    className={`h-10 rounded-lg border-2 text-xs font-semibold transition-all ${
                      theme === t.key
                        ? 'border-zinc-900 shadow-sm scale-[1.02]'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                    style={{ backgroundColor: t.bg, color: t.text }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Color de acento</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {ACCENT_PRESETS.map(color => (
                  <button
                    key={color}
                    onClick={() => onAccentChange(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                      accentColor === color
                        ? 'border-zinc-900 scale-110 shadow-md'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500">Personalizado</label>
                <input
                  type="color"
                  value={accentColor || '#18181b'}
                  onChange={e => onAccentChange(e.target.value)}
                  className="w-7 h-7 rounded border border-zinc-200 cursor-pointer p-0"
                />
                <code className="text-xs text-zinc-400 font-mono">{accentColor}</code>
              </div>
            </div>

            {/* Active modules summary */}
            {layout.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  En la página ({layout.length})
                </p>
                <div className="space-y-0.5">
                  {layout.map((m, i) => {
                    const meta = MODULE_REGISTRY[m.type] || {};
                    return (
                      <div key={m.id} className="flex items-center gap-2 text-xs text-zinc-500 py-1 px-1">
                        <span className="text-zinc-300 w-4 text-right tabular-nums">{i + 1}.</span>
                        <ModuleIcon iconName={meta.icon} className="h-3 w-3 text-zinc-400" />
                        <span>{meta.label || m.type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
