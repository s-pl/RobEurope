import { resolveMediaUrl } from '../../../lib/apiClient';
import { Crown, Shield, User, Users } from 'lucide-react';

const ROLE_META = {
  owner:  { Icon: Crown,  cls: 'text-amber-500', label: 'Fundador' },
  admin:  { Icon: Shield, cls: 'text-blue-500',  label: 'Admin'    },
  member: { Icon: User,   cls: 'text-zinc-400',  label: 'Miembro'  },
};

function sortMembers(members, sortBy) {
  const copy = [...members];
  if (sortBy === 'name') {
    return copy.sort((a, b) => {
      const na = (a.user?.username || a.user?.first_name || '').toLowerCase();
      const nb = (b.user?.username || b.user?.first_name || '').toLowerCase();
      return na.localeCompare(nb);
    });
  }
  if (sortBy === 'role') {
    const order = { owner: 0, admin: 1, member: 2 };
    return copy.sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9));
  }
  return copy; // 'joined' — keep server order
}

export default function MembersModule({ team, config = {}, accentColor }) {
  const { showRole = true, showPhoto = true, limit = 12, sortBy = 'role' } = config;
  const accent     = accentColor || '#18181b';
  const allMembers = team?.members || [];
  const sorted     = sortMembers(allMembers, sortBy);
  const visible    = sorted.slice(0, limit);
  const remaining  = allMembers.length - visible.length;

  if (!allMembers.length) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <Users className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Sin miembros todavía</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-400" />
          <h3 className="font-semibold text-zinc-900 text-sm">Equipo</h3>
        </div>
        <span className="text-xs text-zinc-400">
          {allMembers.length} {allMembers.length === 1 ? 'persona' : 'personas'}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {visible.map((m) => {
          const user     = m.user || m;
          const name     = user?.username || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Usuario';
          const photo    = user?.profile_photo_url;
          const meta     = ROLE_META[m.role] || ROLE_META.member;
          const RoleIcon = meta.Icon;

          return (
            <div
              key={m.id}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-zinc-50 transition-colors text-center"
            >
              {showPhoto && (
                <div className="relative">
                  {photo ? (
                    <img
                      src={resolveMediaUrl(photo)}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white border border-zinc-200"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white select-none"
                      style={{ backgroundColor: accent }}
                    >
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {showRole && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 border border-zinc-100 shadow-sm">
                      <RoleIcon className={`h-3 w-3 ${meta.cls}`} />
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-zinc-800 truncate max-w-[90px]" title={name}>
                  {name}
                </p>
                {showRole && (
                  <p className={`text-[11px] ${meta.cls}`}>{meta.label}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {remaining > 0 && (
        <div className="px-4 pb-3 text-center">
          <span className="text-xs text-zinc-400">y {remaining} más</span>
        </div>
      )}
    </div>
  );
}
