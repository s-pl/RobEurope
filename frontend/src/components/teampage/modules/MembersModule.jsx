import { resolveMediaUrl } from '../../../lib/apiClient';
import { Crown, Shield, User } from 'lucide-react';

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User
};

const ROLE_COLORS = {
  owner: 'text-amber-500',
  admin: 'text-blue-500',
  member: 'text-slate-400'
};

export default function MembersModule({ team, config = {}, accentColor }) {
  const { showRole = true, showPhoto = true } = config;
  const members = team?.members || [];
  const accent = accentColor || '#2563eb';

  if (!members.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400">
        <p className="text-3xl mb-2">👥</p>
        <p className="text-sm">Sin miembros todavía</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span style={{ color: accent }}>👥</span> Equipo
        </h3>
        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
          {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {members.map((m) => {
          const user = m.user || m;
          const name = user?.username || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Usuario';
          const photo = user?.profile_photo_url;
          const RoleIcon = ROLE_ICONS[m.role] || User;
          const roleColor = ROLE_COLORS[m.role] || 'text-slate-400';

          return (
            <div
              key={m.id}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center group"
            >
              {showPhoto && (
                <div className="relative">
                  {photo ? (
                    <img
                      src={resolveMediaUrl(photo)}
                      alt={name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow"
                      style={{ background: accent }}
                    >
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {showRole && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow">
                      <RoleIcon className={`h-3.5 w-3.5 ${roleColor}`} />
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[80px]" title={name}>
                  {name}
                </p>
                {showRole && (
                  <p className={`text-xs capitalize ${roleColor}`}>{m.role}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
