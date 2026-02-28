import { resolveMediaUrl } from '../../../lib/apiClient';
import { Globe, Instagram, Twitter, Youtube, Github, Linkedin } from 'lucide-react';

const SOCIAL_ICONS = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  github: Github,
  linkedin: Linkedin,
  web: Globe,
  website: Globe
};

export default function HeroModule({ team, config = {}, accentColor }) {
  const { showLogo = true, showSocials = true, tagline } = config;
  const socials = team?.social_links || {};
  const accent = accentColor || '#2563eb';

  return (
    <div
      className="relative overflow-hidden rounded-2xl min-h-[220px] flex items-end"
      style={{
        background: `linear-gradient(135deg, ${accent}22 0%, ${accent}55 100%)`,
        borderBottom: `4px solid ${accent}`
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${accent} 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="relative z-10 w-full p-8 flex flex-col md:flex-row items-start md:items-end gap-6">
        {/* Logo */}
        {showLogo && (
          <div className="flex-shrink-0">
            {team?.logo_url ? (
              <img
                src={resolveMediaUrl(team.logo_url)}
                alt={team.name}
                className="w-24 h-24 rounded-2xl object-cover shadow-xl border-4 border-white/30"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black text-white shadow-xl"
                style={{ background: accent }}
              >
                {(team?.name || 'T').substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg tracking-tight">
            {team?.name || 'Nombre del equipo'}
          </h1>
          {(tagline || team?.institution || team?.city) && (
            <p className="mt-2 text-lg text-white/80 font-medium">
              {tagline || [team?.institution, team?.city].filter(Boolean).join(' · ')}
            </p>
          )}
          {team?.description && (
            <p className="mt-3 text-white/70 max-w-2xl line-clamp-2">
              {team.description}
            </p>
          )}
        </div>

        {/* Socials */}
        {showSocials && Object.keys(socials).length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {Object.entries(socials).map(([platform, url]) => {
              if (!url) return null;
              const Icon = SOCIAL_ICONS[platform.toLowerCase()] || Globe;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 backdrop-blur-sm"
                  title={platform}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
            {team?.website_url && (
              <a
                href={team.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 backdrop-blur-sm"
                title="Web"
              >
                <Globe className="h-5 w-5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
