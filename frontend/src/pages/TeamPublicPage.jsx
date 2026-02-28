import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import DragDropCanvas from '../components/teampage/DragDropCanvas';
import TeamPageEditorPanel from '../components/teampage/TeamPageEditorPanel';
import { Edit3, ExternalLink, ArrowLeft } from 'lucide-react';

// ── Theme class maps ────────────────────────────────────────────────────────
const THEME_CLASSES = {
  default: 'bg-slate-50 text-slate-900',
  dark:    'bg-slate-950 text-slate-100',
  tech:    'bg-blue-950 text-blue-100',
  minimal: 'bg-white text-slate-900',
  vibrant: 'bg-gradient-to-br from-purple-950 via-slate-900 to-blue-950 text-white'
};

const TEAM_DOMAIN = import.meta.env.VITE_TEAM_DOMAIN || 'robeurope.samuelponce.es';

/**
 * Public team page with drag-and-drop module system.
 *
 * - Anyone can view it.
 * - Team members (and the owner) can edit the layout by clicking "Editar página".
 * - The page is accessible at /<slug>/page (via App routing) or as a subdomain.
 */
export default function TeamPublicPage({ slug: slugProp, isSubdomain = false }) {
  const params = useParams();
  const slug = slugProp || params.slug;

  const { user, isAuthenticated } = useAuth();
  const [team, setTeam] = useState(null);
  const [page, setPage] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editLayout, setEditLayout] = useState([]);
  const [editTheme, setEditTheme] = useState('default');
  const [editAccent, setEditAccent] = useState('#2563eb');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Is the current user a member of this team?
  const isMember = isAuthenticated && team && (
    team.created_by_user_id === user?.id ||
    (team.members || []).some(m => m.user?.id === user?.id || m.user_id === user?.id)
  );

  // ── Load team + page ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    Promise.all([
      apiRequest(`/teams/by-slug/${slug}`),
      // Load page after team, but we need team.id first — chain below
    ])
      .then(async ([teamData]) => {
        setTeam(teamData);

        // Load page layout
        const pageData = await apiRequest(`/teams/${teamData.id}/page`).catch(() => null);
        setPage(pageData);
        setEditLayout(pageData?.layout || []);
        setEditTheme(pageData?.theme || 'default');
        setEditAccent(pageData?.accent_color || '#2563eb');

        // Compute stats from team data
        const memberCount = teamData?.memberCount ?? (teamData?.members?.length || 0);
        setStats({ memberCount });

        // Load competition registrations for stats
        apiRequest(`/registrations?team_id=${teamData.id}`)
          .then(regs => {
            const regList = Array.isArray(regs) ? regs : [];
            setStats(prev => ({
              ...prev,
              competitionCount: regList.length,
              approvedCount: regList.filter(r => r.status === 'approved').length,
              activeCount: regList.filter(r => r.status === 'pending').length
            }));
          })
          .catch(() => {});
      })
      .catch(err => {
        setError(err.message || 'Equipo no encontrado');
      })
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
    setSaveMsg('');
    try {
      const updated = await apiRequest(`/teams/${team.id}/page`, {
        method: 'PUT',
        body: {
          layout: editLayout,
          theme: editTheme,
          accent_color: editAccent
        }
      });
      setPage(updated);
      setSaveMsg('✓ Guardado correctamente');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Discard changes
      setEditLayout(page?.layout || []);
      setEditTheme(page?.theme || 'default');
      setEditAccent(page?.accent_color || '#2563eb');
    }
    setIsEditing(e => !e);
  };

  // ── Layout state ─────────────────────────────────────────────────────────
  const displayLayout = isEditing ? editLayout : (page?.layout || []);
  const displayTheme  = isEditing ? editTheme  : (page?.theme  || 'default');
  const displayAccent = isEditing ? editAccent : (page?.accent_color || '#2563eb');

  const themeClass = THEME_CLASSES[displayTheme] || THEME_CLASSES.default;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen ${themeClass} flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto animate-pulse" style={{ background: '#2563eb22' }} />
          <p className="text-slate-400 text-sm">Cargando página del equipo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${themeClass} flex items-center justify-center`}>
        <div className="text-center space-y-4 max-w-sm p-8">
          <p className="text-6xl">🤖</p>
          <h1 className="text-2xl font-bold">Equipo no encontrado</h1>
          <p className="text-slate-500 text-sm">{error}</p>
          {!isSubdomain && (
            <a href="/teams" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <ArrowLeft className="h-4 w-4" /> Ver todos los equipos
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClass}`}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
          {!isSubdomain && (
            <a
              href="/teams"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Equipos
            </a>
          )}

          <div className="flex-1">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{team?.name}</span>
            {team?.slug && (
              <a
                href={`http://${team.slug}.${TEAM_DOMAIN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs text-slate-400 hover:text-blue-500 inline-flex items-center gap-1"
              >
                {team.slug}.{TEAM_DOMAIN}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Save message */}
          {saveMsg && (
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              saveMsg.startsWith('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}>
              {saveMsg}
            </span>
          )}

          {/* Edit button — only for members */}
          {isMember && (
            <button
              onClick={handleToggleEdit}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                isEditing
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              {isEditing ? 'Cancelar edición' : 'Editar página'}
            </button>
          )}
        </div>
      </div>

      {/* Main layout — editor panel on the right when editing */}
      <div className={`flex max-w-none transition-all duration-300 ${isEditing ? '' : ''}`}>
        {/* Canvas area */}
        <div className={`flex-1 transition-all duration-300 ${isEditing ? 'pr-[320px]' : ''}`}>
          <div className="max-w-5xl mx-auto px-4 py-8">
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

            {/* Empty state for non-editors */}
            {!isEditing && displayLayout.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <p className="text-6xl">🚧</p>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  Esta página está en construcción
                </h2>
                <p className="text-slate-500">
                  {isMember
                    ? 'Edita la página para añadir módulos y mostrar información de tu equipo.'
                    : 'El equipo aún no ha personalizado su página pública.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Editor panel — fixed on the right */}
        {isEditing && (
          <div className="fixed right-0 top-0 bottom-0 w-[300px] z-50 pt-[53px]">
            <TeamPageEditorPanel
              layout={editLayout}
              theme={editTheme}
              accentColor={editAccent}
              onAddModule={handleAddModule}
              onThemeChange={setEditTheme}
              onAccentChange={setEditAccent}
              onSave={handleSave}
              saving={saving}
              isEditing={isEditing}
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
