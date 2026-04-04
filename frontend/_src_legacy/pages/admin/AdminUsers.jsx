import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { AdaptiveModal, AdaptiveModalContent, AdaptiveModalFooter } from '../../components/ui/adaptive-modal';
import { resolveMediaUrl } from '../../lib/apiClient';
import {
  Users, Search, Edit, Trash2, Shield, User, Loader2, Save,
  Ban, CheckCircle, ChevronDown, Github, Globe, Mail,
  Building2, MapPin, Calendar,
} from 'lucide-react';

/* ── helpers ── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('es-ES') : '—';
const roleColor = {
  super_admin:  'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  center_admin: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  user:         'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700',
};

const RoleBadge = ({ role }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border ${roleColor[role] ?? roleColor.user}`}>
    {role === 'super_admin' && <Shield className="h-2.5 w-2.5" />}
    {role}
  </span>
);

const Avatar = ({ src, name, size = 8 }) => {
  const initials = (name || '??').slice(0, 2).toUpperCase();
  return src
    ? <img src={resolveMediaUrl(src)} alt={name} className={`h-${size} w-${size} object-cover shrink-0`} />
    : (
      <div className={`h-${size} w-${size} shrink-0 flex items-center justify-center bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold`}>
        {initials}
      </div>
    );
};

/* ── Detail drawer ── */
const UserDrawer = ({ user: u, onClose, onBan, onDelete, onSave, saving, t }) => {
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({
    first_name: u.first_name ?? '',
    last_name:  u.last_name  ?? '',
    username:   u.username   ?? '',
    email:      u.email      ?? '',
    role:       u.role       ?? 'user',
    is_active:  u.is_active  ?? true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AdaptiveModal open onOpenChange={onClose}>
      <AdaptiveModalContent title={`${u.first_name} ${u.last_name}`} description={`@${u.username} · ${u.email}`}>
        {/* tabs */}
        <div className="flex border-b-2 border-stone-200 dark:border-stone-700 mb-4 -mx-1">
          {[['info', t('admin.users.tabInfo')], ['editar', t('admin.users.tabEdit')]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === key
                  ? 'border-b-2 border-stone-900 dark:border-stone-50 text-stone-900 dark:text-stone-50'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-center py-2">
              <Avatar src={u.profile_photo_url} name={u.first_name} size={16} />
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              <RoleBadge role={u.role} />
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border ${
                u.is_active
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {u.is_active ? <CheckCircle className="h-2.5 w-2.5" /> : <Ban className="h-2.5 w-2.5" />}
                {u.is_active ? t('admin.users.statusActive') : t('admin.users.statusBanned')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {u.Country && (
                <div className="flex items-center gap-1.5 text-stone-500"><MapPin className="h-3.5 w-3.5 shrink-0" />{u.Country.name}</div>
              )}
              {u.educationalCenter && (
                <div className="flex items-center gap-1.5 text-stone-500"><Building2 className="h-3.5 w-3.5 shrink-0" />{u.educationalCenter.name}</div>
              )}
              {u.team && (
                <div className="flex items-center gap-1.5 text-stone-500"><Users className="h-3.5 w-3.5 shrink-0" />{u.team.name} ({u.team_role})</div>
              )}
              <div className="flex items-center gap-1.5 text-stone-500"><Calendar className="h-3.5 w-3.5 shrink-0" />{t('admin.users.registered')} {fmt(u.created_at)}</div>
              {u.google_id && <div className="flex items-center gap-1.5 text-stone-500"><Globe className="h-3.5 w-3.5 shrink-0" />{t('admin.users.authGoogle')}</div>}
              {u.github_id && <div className="flex items-center gap-1.5 text-stone-500"><Github className="h-3.5 w-3.5 shrink-0" />{t('admin.users.authGitHub')}</div>}
            </div>
            {u.bio && <p className="text-stone-500 dark:text-stone-400 text-xs border-t border-stone-100 dark:border-stone-800 pt-2">{u.bio}</p>}
          </div>
        )}

        {tab === 'editar' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Nombre</label>
                <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Apellido</label>
                <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Username</label>
              <Input value={form.username} onChange={e => set('username', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Email</label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Rol</label>
                <select value={form.role} onChange={e => set('role', e.target.value)}
                  className="w-full border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 px-3 py-2 text-sm focus:outline-none focus:border-stone-900 dark:focus:border-stone-50">
                  <option value="user">user</option>
                  <option value="center_admin">center_admin</option>
                  <option value="super_admin">super_admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Estado</label>
                <select value={form.is_active ? 'active' : 'inactive'} onChange={e => set('is_active', e.target.value === 'active')}
                  className="w-full border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 px-3 py-2 text-sm focus:outline-none focus:border-stone-900 dark:focus:border-stone-50">
                  <option value="active">Activo</option>
                  <option value="inactive">Baneado</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <AdaptiveModalFooter>
          <div className="flex gap-2 flex-wrap">
            {u.role !== 'super_admin' && (
              <Button variant="outline" size="sm" onClick={() => onBan(u)}
                className={u.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}>
                {u.is_active ? <><Ban className="h-3.5 w-3.5 mr-1" />Banear</> : <><CheckCircle className="h-3.5 w-3.5 mr-1" />Desbanear</>}
              </Button>
            )}
            {tab === 'editar' && (
              <Button size="sm" onClick={() => onSave(form)} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Guardar
              </Button>
            )}
          </div>
        </AdaptiveModalFooter>
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
};

/* ── Main ── */
export default function AdminUsers() {
  const { t } = useTranslation();
  const api = useApi();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    api('/admin/users').then(setUsers).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'banned' && u.is_active) return false;
      if (!q) return true;
      return [u.username, u.email, u.first_name, u.last_name].some(f => (f || '').toLowerCase().includes(q));
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleBan = async (u) => {
    await api(`/admin/users/${u.id}/ban`, { method: 'POST' });
    setSelected(null);
    load();
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      await api(`/admin/users/${selected.id}`, { method: 'PATCH', body: form });
      setSelected(null);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await api(`/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    setSelected(null);
    load();
  };

  const filterBtn = (label, active, onClick) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium border-2 transition-colors ${
        active ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-stone-900 dark:border-stone-50'
               : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400'
      }`}>
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-4xl font-black tracking-tighter text-stone-900 dark:text-stone-50">Usuarios</h1>
        <div className="h-1 w-12 bg-stone-900 dark:bg-stone-50" />
        <p className="text-sm text-stone-500 dark:text-stone-400">{users.length} usuarios · {users.filter(u => !u.is_active).length} baneados</p>
      </div>
      <div className="h-px bg-stone-200 dark:bg-stone-800" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <Input className="pl-8 h-8 text-sm w-56" placeholder={t('admin.users.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {filterBtn('Todos', roleFilter === 'all', () => setRoleFilter('all'))}
          {filterBtn('user', roleFilter === 'user', () => setRoleFilter('user'))}
          {filterBtn('center_admin', roleFilter === 'center_admin', () => setRoleFilter('center_admin'))}
          {filterBtn('super_admin', roleFilter === 'super_admin', () => setRoleFilter('super_admin'))}
        </div>
        <div className="flex gap-1">
          {filterBtn('Activos', statusFilter === 'active', () => setStatusFilter(s => s === 'active' ? 'all' : 'active'))}
          {filterBtn('Baneados', statusFilter === 'banned', () => setStatusFilter(s => s === 'banned' ? 'all' : 'banned'))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-stone-100 dark:bg-stone-800 animate-pulse" />)}</div>
      ) : (
        <div className="border-2 border-stone-200 dark:border-stone-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
                <th className="text-left px-4 py-3 font-semibold text-stone-600 dark:text-stone-400">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-stone-600 dark:text-stone-400 hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-stone-600 dark:text-stone-400">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-stone-600 dark:text-stone-400 hidden md:table-cell">Equipo</th>
                <th className="text-left px-4 py-3 font-semibold text-stone-600 dark:text-stone-400 hidden sm:table-cell">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-stone-600 dark:text-stone-400">·</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.015 }}
                    className={`border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors cursor-pointer ${!u.is_active ? 'opacity-60' : ''}`}
                    onClick={() => setSelected(u)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={u.profile_photo_url} name={u.first_name} />
                        <div>
                          <div className="font-medium text-stone-900 dark:text-stone-50">{u.first_name} {u.last_name}</div>
                          <div className="text-xs text-stone-500">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden lg:table-cell">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell text-xs">{u.team?.name ?? '—'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium ${u.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {u.is_active ? '● Activo' : '⊘ Baneado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {u.id !== me?.id && u.role !== 'super_admin' && (
                          <button onClick={() => setDeleteTarget(u)}
                            className="p-1.5 text-stone-300 hover:text-red-600 dark:hover:text-red-400 transition-colors" title={t('admin.users.confirmDelete')}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-stone-400">
              <Users className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>{t('admin.users.empty')}</p>
            </div>
          )}
        </div>
      )}

      {selected && (
        <UserDrawer user={selected} onClose={() => setSelected(null)}
          onBan={handleBan} onDelete={() => setDeleteTarget(selected)}
          onSave={handleSave} saving={saving} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t('admin.users.confirmDelete')}
        description={`Se eliminará permanentemente ${deleteTarget?.username}. Esta acción no se puede deshacer.`}
        confirmText={t('common.delete')}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
