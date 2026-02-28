import { useRef, useState } from 'react';
import ModuleRenderer from './ModuleRenderer';
import { MODULE_REGISTRY } from './moduleRegistry';
import {
  GripVertical, Trash2, Settings2, ChevronUp, ChevronDown, LayoutGrid
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RichTextEditor } from '../ui/RichTextEditor';
import {
  Trophy, Calendar, Star, Target, Zap, Heart, Flag, Clock,
  Medal, Award, TrendingUp, Users, Cpu, BookOpen, Globe
} from 'lucide-react';

const CUSTOM_ICON_OPTIONS = [
  { value: 'Trophy', Icon: Trophy },   { value: 'Medal',      Icon: Medal       },
  { value: 'Award',  Icon: Award  },   { value: 'Star',       Icon: Star        },
  { value: 'Target', Icon: Target },   { value: 'TrendingUp', Icon: TrendingUp  },
  { value: 'Zap',    Icon: Zap    },   { value: 'Heart',      Icon: Heart       },
  { value: 'Users',  Icon: Users  },   { value: 'Calendar',   Icon: Calendar    },
  { value: 'Clock',  Icon: Clock  },   { value: 'Flag',       Icon: Flag        },
  { value: 'Cpu',    Icon: Cpu    },   { value: 'BookOpen',   Icon: BookOpen    },
  { value: 'Globe',  Icon: Globe  },
];

// ─── Config Dialog ──────────────────────────────────────────────────────────

function ModuleConfigDialog({ module, open, onOpenChange, onSave }) {
  const [draft, setDraft] = useState(module?.config || {});
  const set = (key, val) => setDraft(prev => ({ ...prev, [key]: val }));

  if (!module) return null;

  const type = module.type;

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-zinc-900">
            Configurar módulo — {MODULE_REGISTRY[type]?.label || type}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* ── Hero ── */}
          {type === 'hero' && (
            <>
              <Field label="Eslogan personalizado">
                <Input
                  value={draft.tagline || ''}
                  onChange={e => set('tagline', e.target.value)}
                  placeholder="Una frase que os represente"
                />
              </Field>
              <Field label="Mostrar logo">
                <Toggle value={draft.showLogo ?? true} onChange={v => set('showLogo', v)} />
              </Field>
              <Field label="Mostrar redes sociales">
                <Toggle value={draft.showSocials ?? true} onChange={v => set('showSocials', v)} />
              </Field>
            </>
          )}

          {/* ── Members ── */}
          {type === 'members' && (
            <>
              <Field label="Mostrar fotos">
                <Toggle value={draft.showPhoto ?? true} onChange={v => set('showPhoto', v)} />
              </Field>
              <Field label="Mostrar rol">
                <Toggle value={draft.showRole ?? true} onChange={v => set('showRole', v)} />
              </Field>
              <Field label="Número máximo">
                <Input
                  type="number" min={1} max={50}
                  value={draft.limit ?? 12}
                  onChange={e => set('limit', Number(e.target.value))}
                  className="w-24"
                />
              </Field>
              <Field label="Ordenar por">
                <Select value={draft.sortBy || 'role'} onValueChange={v => set('sortBy', v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">Rol</SelectItem>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="joined">Incorporación</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {/* ── Posts ── */}
          {type === 'posts' && (
            <>
              <Field label="Número de publicaciones">
                <Input
                  type="number" min={1} max={20}
                  value={draft.limit ?? 5}
                  onChange={e => set('limit', Number(e.target.value))}
                  className="w-24"
                />
              </Field>
              <Field label="Orden">
                <Select value={draft.sortBy || 'newest'} onValueChange={v => set('sortBy', v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="oldest">Más antiguos</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Mostrar autor">
                <Toggle value={draft.showAuthor ?? true} onChange={v => set('showAuthor', v)} />
              </Field>
              <Field label="Mostrar fecha">
                <Toggle value={draft.showDate ?? true} onChange={v => set('showDate', v)} />
              </Field>
            </>
          )}

          {/* ── Competitions ── */}
          {type === 'competitions' && (
            <>
              <Field label="Número máximo">
                <Input
                  type="number" min={1} max={50}
                  value={draft.limit ?? 8}
                  onChange={e => set('limit', Number(e.target.value))}
                  className="w-24"
                />
              </Field>
              <Field label="Filtrar por estado">
                <Select value={draft.statusFilter || 'all'} onValueChange={v => set('statusFilter', v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="approved">Aprobadas</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="rejected">Rechazadas</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Mostrar fecha">
                <Toggle value={draft.showDate ?? true} onChange={v => set('showDate', v)} />
              </Field>
            </>
          )}

          {/* ── Rich text ── */}
          {(type === 'richtext' || type === 'about') && (
            <>
              <Field label="Título del bloque" column>
                <Input
                  value={draft.title || ''}
                  onChange={e => set('title', e.target.value)}
                  placeholder="Título opcional"
                />
              </Field>
              <Field label="Contenido" column>
                <RichTextEditor
                  value={draft.content || ''}
                  onChange={v => set('content', v)}
                  placeholder="Escribe aquí..."
                />
              </Field>
            </>
          )}

          {/* ── Custom stats ── */}
          {type === 'customstats' && (
            <CustomStatsEditor items={draft.items || []} onChange={v => set('items', v)} />
          )}

          {/* ── Gallery ── */}
          {type === 'gallery' && (
            <>
              <Field label="Número de imágenes">
                <Input
                  type="number" min={1} max={48}
                  value={draft.limit ?? 12}
                  onChange={e => set('limit', Number(e.target.value))}
                  className="w-24"
                />
              </Field>
              <Field label="Columnas">
                <Select value={String(draft.columns || 3)} onValueChange={v => set('columns', Number(v))}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {/* ── Robots ── */}
          {type === 'robots' && (
            <Field label="Número de archivos">
              <Input
                type="number" min={1} max={20}
                value={draft.limit ?? 6}
                onChange={e => set('limit', Number(e.target.value))}
                className="w-24"
              />
            </Field>
          )}

          {/* ── Countdown ── */}
          {type === 'countdown' && (
            <Field label="Etiqueta">
              <Input
                value={draft.label || ''}
                onChange={e => set('label', e.target.value)}
                placeholder="Próxima competición"
              />
            </Field>
          )}

          {/* No config */}
          {['stats', 'social'].includes(type) && (
            <p className="text-sm text-zinc-400 py-2">
              Este módulo no tiene opciones configurables.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-zinc-100">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#18181b' }}
          >
            Guardar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Custom stats item editor ─────────────────────────────────────────────────

function CustomStatsEditor({ items, onChange }) {
  const addItem = () => onChange([...items, { value: '', label: 'Nuevo indicador', icon: 'Trophy' }]);
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [key]: val } : item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700">Indicadores ({items.length})</p>
        <button
          onClick={addItem}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
        >
          + Añadir
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start p-3 rounded-lg border border-zinc-100 bg-zinc-50">
          {/* Icon picker */}
          <div className="flex flex-wrap gap-1 w-32 flex-shrink-0">
            {CUSTOM_ICON_OPTIONS.slice(0, 6).map(({ value, Icon }) => (
              <button
                key={value}
                onClick={() => updateItem(i, 'icon', value)}
                className={`p-1.5 rounded transition-colors ${
                  item.icon === value
                    ? 'bg-zinc-900 text-white'
                    : 'hover:bg-zinc-200 text-zinc-500'
                }`}
                title={value}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-1.5">
            <Input
              value={item.value}
              onChange={e => updateItem(i, 'value', e.target.value)}
              placeholder="Valor (ej. 42)"
              className="h-8 text-sm"
            />
            <Input
              value={item.label}
              onChange={e => updateItem(i, 'label', e.target.value)}
              placeholder="Etiqueta"
              className="h-8 text-sm"
            />
          </div>
          <button
            onClick={() => removeItem(i)}
            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Field({ label, column = false, children }) {
  return (
    <div className={`flex ${column ? 'flex-col gap-1.5' : 'items-center justify-between gap-4'}`}>
      <label className="text-sm font-medium text-zinc-700 flex-shrink-0">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
        value ? 'bg-zinc-900' : 'bg-zinc-300'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────

export default function DragDropCanvas({
  layout,
  team,
  stats,
  accentColor,
  isEditing,
  onLayoutChange,
  onModuleConfigChange,
  onRemoveModule,
}) {
  const dragIndexRef   = useRef(null);
  const [dragOver, setDragOver]           = useState(null);
  const [configModule, setConfigModule]   = useState(null); // module being configured

  const moveModule = (from, to) => {
    if (from === to) return;
    const next = [...layout];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onLayoutChange(next);
  };

  const moveUp   = (i) => { if (i > 0) moveModule(i, i - 1); };
  const moveDown = (i) => { if (i < layout.length - 1) moveModule(i, i + 1); };

  return (
    <>
      <div className="space-y-4">
        {layout.map((mod, index) => {
          const meta        = MODULE_REGISTRY[mod.type] || {};
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
                isDragTarget ? 'ring-2 ring-offset-2 rounded-xl scale-[1.005]' : ''
              }`}
              style={isDragTarget ? { '--tw-ring-color': accentColor || '#18181b' } : {}}
            >
              {/* Edit toolbar */}
              {isEditing && (
                <div className="absolute -top-3 left-3 right-3 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <div
                    className="cursor-grab active:cursor-grabbing flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 text-white rounded-full text-xs shadow-lg select-none"
                    title="Arrastrar"
                  >
                    <GripVertical className="h-3 w-3" />
                    <span className="font-medium">{meta.label || mod.type}</span>
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 bg-zinc-900 text-white rounded-full hover:bg-zinc-700 disabled:opacity-30 shadow-lg transition-colors"
                    title="Subir"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === layout.length - 1}
                    className="p-1 bg-zinc-900 text-white rounded-full hover:bg-zinc-700 disabled:opacity-30 shadow-lg transition-colors"
                    title="Bajar"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfigModule(mod)}
                    className="p-1 bg-zinc-900 text-white rounded-full hover:bg-zinc-700 shadow-lg transition-colors"
                    title="Configurar"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveModule(mod.id)}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Module content */}
              <div className={isEditing ? 'ring-1 ring-transparent group-hover:ring-zinc-200 rounded-xl transition-all' : ''}>
                <ModuleRenderer
                  module={mod}
                  team={team}
                  stats={stats}
                  isEditing={false}
                  onConfigChange={onModuleConfigChange}
                  accentColor={accentColor}
                />
              </div>
            </div>
          );
        })}

        {layout.length === 0 && isEditing && (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 p-16 text-center">
            <LayoutGrid className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="font-medium text-zinc-500">Añade módulos desde el panel lateral</p>
            <p className="text-sm text-zinc-400 mt-1">Arrastra para reordenarlos</p>
          </div>
        )}
      </div>

      {/* Config dialog */}
      <ModuleConfigDialog
        module={configModule}
        open={!!configModule}
        onOpenChange={(open) => { if (!open) setConfigModule(null); }}
        onSave={(newConfig) => {
          if (configModule) onModuleConfigChange(configModule.id, newConfig);
        }}
      />
    </>
  );
}
