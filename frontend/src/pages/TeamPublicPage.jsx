import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import DragDropCanvas from '../components/teampage/DragDropCanvas';
import TeamPageEditorPanel from '../components/teampage/TeamPageEditorPanel';
import { Edit3, ExternalLink, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const THEME_BG = {
  default: 'bg-slate-50',
  dark:    'bg-slate-950',
  minimal: 'bg-white',
  warm:    'bg-orange-50',
};

const TEAM_DOMAIN = import.meta.env.VITE_TEAM_DOMAIN || 'robeurope.samuelponce.es';

export default function TeamPublicPage({ slug: slugProp, isSubdomain = false }) {
  const params = useParams();
  const slug   = slugProp || params.slug;

  const { user, isAuthenticated } = useAuth();
  const [team, setTeam]   = useState(null);
  const [page, setPage]   = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [isEditing, setIsEditing]   = useState(false);
  const [editLayout, setEditLayout] = useState([]);
  const [editTheme, setEditTheme]   = useState('default');
  const [editAccent, setEditAccent] = useState('#18181b');
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState(null); // { type: 'ok'|'error', text }

  const isMember = isAuthenticated && team && (
    team.created_by_user_id === user?.id ||
    (team.members || []).some(m => m.user?.id === user?.id || m.user_id === user?.id)
  );

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    apiRequest(`/teams/by-slug/${slug}`)
      .then(async (teamData) => {
        setTeam(teamData);

        const pageData = await apiRequest(`/teams/${teamData.id}/page`).catch(() => null);
        setPage(pageData);
        setEditLayout(pageData?.layout || []);
        setEditTheme(pageData?.theme || 'default');
        setEditAccent(pageData?.accent_color || '#18181b');

        const memberCount = teamData?.memberCount ?? (teamData?.members?.length || 0);
        setStats({ memberCount });

        apiRequest(`/registrations?team_id=${teamData.id}`)
          .then(regs => {
            const list = Array.isArray(regs) ? regs : [];
            setStats(prev => ({
              ...prev,
              competitionCount: list.length,
              approvedCount:    list.filter(r => r.status === 'approved').length,
              activeCount:      list.filter(r => r.status === 'pending').length,
            }));
          })
          .catch(() => {});
      })
      .catch(err => setError(err.message || 'Equipo no encontrado'))
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddModule = useCallback((mod) => {
    setEditLayout(prev => [...prev, mod]);
  }, []);

  const handleRemoveModule = useCallback((id) => {
    setEditLayout(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleModuleConfigChange = useCallback((id, newConfig) => {
    setEditLayout(prev => prev.map(m => m.id === id ? { ...m, config: newConfig } : m));
  }, []);

  const handleSave = async () => {
    if (!team) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await apiRequest(`/teams/${team.id}/page`, {
        method: 'PUT',
        body:   { layout: editLayout, theme: editTheme, accent_color: editAccent },
      });
      setPage(updated);
      setSaveMsg({ type: 'ok', text: 'Guardado' });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setEditLayout(page?.layout || []);
      setEditTheme(page?.theme || 'default');
      setEditAccent(page?.accent_color || '#18181b');
    }
    setIsEditing(e => !e);
  };

  // ── Display state ─────────────────────────────────────────────────────────
  const displayLayout = isEditing ? editLayout : (page?.layout || []);
  const displayTheme  = isEditing ? editTheme  : (page?.theme  || 'default');
  const displayAccent = isEditing ? editAccent : (page?.accent_color || '#18181b');

  const bgClass = THEME_BG[displayTheme] || THEME_BG.default;
  const darkText = ['dark'].includes(displayTheme);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl mx-auto animate-pulse bg-zinc-200" />
          <p className="text-zinc-400 text-sm">Cargando…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6 text-zinc-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900">Equipo no encontrado</h1>
          <p className="text-zinc-500 text-sm">{error}</p>
          {!isSubdomain && (
            <a
              href="/teams"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ver todos los equipos
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-200 ${bgClass}`}>

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-zinc-200 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 min-h-[46px]">
          {!isSubdomain && (
            <a
              href="/teams"
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Equipos</span>
            </a>
          )}

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 truncate">{team?.name}</span>
            {team?.slug && (
              <a
                href={`https://${team.slug}.${TEAM_DOMAIN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {team.slug}.{TEAM_DOMAIN}
              </a>
            )}
          </div>

          {/* Save status */}
          {saveMsg && (
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              saveMsg.type === 'ok'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            }`}>
              {saveMsg.type === 'ok'
                ? <CheckCircle2 className="h-3.5 w-3.5" />
                : <AlertCircle className="h-3.5 w-3.5" />
              }
              {saveMsg.text}
            </span>
          )}

          {/* Edit toggle — members only */}
          {isMember && (
            <button
              onClick={handleToggleEdit}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                isEditing
                  ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  : 'bg-zinc-900 hover:bg-zinc-700 text-white'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
          )}
        </div>
      </div>

      {/* Content + Editor panel */}
      <div className="flex h-[calc(100vh-46px)] overflow-hidden">

        {/* Canvas */}
        <div className={`flex-1 overflow-y-auto transition-all ${isEditing ? '' : ''}`}>
          <div className="max-w-4xl mx-auto px-4 py-8">
            <DragDropCanvas
              layout={displayLayout}
              team={team}
              stats={stats}
              accentColor={displayAccent}
              isEditing={isEditing}
              onLayoutChange={setEditLayout}
              onModuleConfigChange={handleModuleConfigChange}
              onRemoveModule={handleRemoveModule}
            />

            {/* Empty state for visitors */}
            {!isEditing && displayLayout.length === 0 && (
              <div className="text-center py-20 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto">
                  <Edit3 className="h-6 w-6 text-zinc-400" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-700">
                  Página sin configurar
                </h2>
                <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                  {isMember
                    ? 'Pulsa "Editar" para añadir módulos y personalizar esta página.'
                    : 'El equipo todavía no ha configurado su página pública.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Editor panel — fixed on right */}
        {isEditing && (
          <div className="w-[280px] flex-shrink-0 border-l border-zinc-200 overflow-hidden">
            <TeamPageEditorPanel
              layout={editLayout}
              theme={editTheme}
              accentColor={editAccent}
              onAddModule={handleAddModule}
              onThemeChange={setEditTheme}
              onAccentChange={setEditAccent}
              onSave={handleSave}
              saving={saving}
              onToggleEdit={handleToggleEdit}
              teamDomain={TEAM_DOMAIN}
              teamSlug={team?.slug}
            />
          </div>
        )}
      </div>
    </div>
  );
}
