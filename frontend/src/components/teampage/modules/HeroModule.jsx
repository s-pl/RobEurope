import { resolveMediaUrl } from '../../../lib/apiClient';
import { Globe, Instagram, Twitter, Youtube, Github, Linkedin, Building2 } from 'lucide-react';

const SOCIAL_ICONS = {
  instagram: Instagram,
  twitter:   Twitter,
  youtube:   Youtube,
  github:    Github,
  linkedin:  Linkedin,
  web:       Globe,
  website:   Globe,
};

const SOCIAL_LABELS = {
  instagram: 'Instagram',
  twitter:   'Twitter',
  youtube:   'YouTube',
  github:    'GitHub',
  linkedin:  'LinkedIn',
  web:       'Web',
  website:   'Web',
};

export default function HeroModule({ team, config = {}, accentColor }) {
  const { showLogo = true, showSocials = true, tagline = '' } = config;
  const socials = team?.social_links || {};
  const accent  = accentColor || '#18181b';

  const subtitle = tagline || [team?.institution, team?.city].filter(Boolean).join(' · ');

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
        {/* Logo */}
        {showLogo && (
          <div className="flex-shrink-0">
            {team?.logo_url ? (
              <img
                src={resolveMediaUrl(team.logo_url)}
                alt={team.name}
                className="w-20 h-20 rounded-xl object-cover border border-zinc-200"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-black text-white select-none"
                style={{ backgroundColor: accent }}
              >
                {(team?.name || 'T').substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 leading-tight">
            {team?.name || 'Nombre del equipo'}
          </h1>

          {subtitle && (
            <p className="mt-1 text-sm text-zinc-500 flex items-center gap-1.5">
              {team?.institution && <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />}
              {subtitle}
            </p>
          )}

          {team?.description && (
            <p className="mt-3 text-sm text-zinc-600 leading-relaxed max-w-2xl line-clamp-3">
              {team.description}
            </p>
          )}

          {/* Social links */}
          {showSocials && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(socials).map(([platform, url]) => {
                if (!url) return null;
                const Icon  = SOCIAL_ICONS[platform.toLowerCase()] || Globe;
                const label = SOCIAL_LABELS[platform.toLowerCase()] || platform;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </a>
                );
              })}
              {team?.website_url && !socials.web && !socials.website && (
                <a
                  href={team.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Web
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
