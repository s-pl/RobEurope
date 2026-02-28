import { useRef, useState } from 'react';
import ModuleRenderer from './ModuleRenderer';
import { MODULE_REGISTRY } from './moduleRegistry';
import { GripVertical, Trash2, Settings2, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * A drag-and-drop canvas for the team page editor.
 * Uses native HTML5 drag API — no extra dependencies.
 */
export default function DragDropCanvas({
  layout,
  team,
  stats,
  accentColor,
  isEditing,
  onLayoutChange,
  onModuleConfigChange,
  onRemoveModule
}) {
  const dragIndexRef = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const [expandedConfig, setExpandedConfig] = useState(null);

  const moveModule = (from, to) => {
    if (from === to) return;
    const next = [...layout];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onLayoutChange(next);
  };

  const moveUp = (index) => { if (index > 0) moveModule(index, index - 1); };
  const moveDown = (index) => { if (index < layout.length - 1) moveModule(index, index + 1); };

  return (
    <div className="space-y-4">
      {layout.map((mod, index) => {
        const meta = MODULE_REGISTRY[mod.type] || {};
        const isDragTarget = dragOver === index;

        return (
          <div
            key={mod.id}
            draggable={isEditing}
            onDragStart={() => { dragIndexRef.current = index; }}
            onDragEnd={() => { dragIndexRef.current = null; setDragOver(null); }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
                setDragOver(index);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndexRef.current !== null) moveModule(dragIndexRef.current, index);
              setDragOver(null);
            }}
            className={`group relative transition-all duration-200 ${
              isDragTarget ? 'ring-2 ring-blue-500 ring-offset-2 rounded-2xl scale-[1.01]' : ''
            }`}
          >
            {/* Edit overlay bar */}
            {isEditing && (
              <div className="absolute -top-3 left-4 right-4 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Drag handle */}
                <div
                  className="cursor-grab active:cursor-grabbing flex items-center gap-1 px-2 py-1 bg-slate-800 text-white rounded-full text-xs shadow-lg select-none"
                  title="Arrastrar para mover"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                  <span className="font-medium">{meta.icon} {meta.label || mod.type}</span>
                </div>

                <div className="flex-1" />

                {/* Move up/down */}
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-1 bg-slate-800 text-white rounded-full hover:bg-slate-700 disabled:opacity-30 shadow-lg"
                  title="Subir"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === layout.length - 1}
                  className="p-1 bg-slate-800 text-white rounded-full hover:bg-slate-700 disabled:opacity-30 shadow-lg"
                  title="Bajar"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {/* Config toggle */}
                <button
                  onClick={() => setExpandedConfig(expandedConfig === mod.id ? null : mod.id)}
                  className="p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                  title="Configurar"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </button>

                {/* Remove */}
                <button
                  onClick={() => onRemoveModule(mod.id)}
                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  title="Eliminar módulo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Module */}
            <div className={isEditing ? 'ring-1 ring-transparent group-hover:ring-slate-300 dark:group-hover:ring-slate-600 rounded-2xl transition-all' : ''}>
              <ModuleRenderer
                module={mod}
                team={team}
                stats={stats}
                isEditing={isEditing && expandedConfig === mod.id}
                onConfigChange={onModuleConfigChange}
                accentColor={accentColor}
              />
            </div>

            {/* Config panel (when expanded) */}
            {isEditing && expandedConfig === mod.id && (
              <ModuleConfigPanel
                module={mod}
                onChange={(newConfig) => onModuleConfigChange(mod.id, newConfig)}
              />
            )}
          </div>
        );
      })}

      {layout.length === 0 && isEditing && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-16 text-center text-slate-400">
          <p className="text-4xl mb-3">🧩</p>
          <p className="font-medium">Añade módulos desde el panel lateral</p>
          <p className="text-sm mt-1">Arrastra y suelta para reordenarlos</p>
        </div>
      )}
    </div>
  );
}

// ── Simple config panel for common module options ──────────────────────────

function ModuleConfigPanel({ module, onChange }) {
  const config = module.config || {};

  const handleChange = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  // Per-module config fields
  const fields = getConfigFields(module.type);
  if (!fields.length) return null;

  return (
    <div className="mt-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Opciones del módulo</p>
      {fields.map(({ key, label, type, options }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <label className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</label>
          {type === 'toggle' && (
            <button
              onClick={() => handleChange(key, !config[key])}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                config[key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                config[key] ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          )}
          {type === 'number' && (
            <input
              type="number"
              min={1}
              max={20}
              value={config[key] ?? 5}
              onChange={(e) => handleChange(key, Number(e.target.value))}
              className="w-16 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
            />
          )}
          {type === 'text' && (
            <input
              type="text"
              value={config[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="flex-1 max-w-[200px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function getConfigFields(type) {
  const fieldMap = {
    hero: [
      { key: 'showLogo', label: 'Mostrar logo', type: 'toggle' },
      { key: 'showSocials', label: 'Mostrar redes sociales', type: 'toggle' },
      { key: 'tagline', label: 'Eslogan personalizado', type: 'text' }
    ],
    members: [
      { key: 'showRole', label: 'Mostrar rol', type: 'toggle' },
      { key: 'showPhoto', label: 'Mostrar foto', type: 'toggle' }
    ],
    posts: [
      { key: 'limit', label: 'Número de publicaciones', type: 'number' }
    ],
    competitions: [
      { key: 'limit', label: 'Número de competiciones', type: 'number' }
    ],
    gallery: [
      { key: 'limit', label: 'Número de imágenes', type: 'number' }
    ],
    robots: [
      { key: 'limit', label: 'Número de robots', type: 'number' }
    ],
    countdown: [
      { key: 'label', label: 'Etiqueta', type: 'text' }
    ]
  };
  return fieldMap[type] || [];
}
