import { Globe, Instagram, Twitter, Youtube, Github, Linkedin, ExternalLink } from 'lucide-react';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', Icon: Instagram, color: '#E1306C' },
  { key: 'twitter',   label: 'Twitter/X',  Icon: Twitter,   color: '#1DA1F2' },
  { key: 'youtube',   label: 'YouTube',    Icon: Youtube,   color: '#FF0000' },
  { key: 'github',    label: 'GitHub',     Icon: Github,    color: '#171515' },
  { key: 'linkedin',  label: 'LinkedIn',   Icon: Linkedin,  color: '#0A66C2' }
];

export default function SocialModule({ team, accentColor }) {
  const accent = accentColor || '#2563eb';
  const socials = team?.social_links || {};
  const website = team?.website_url;

  const links = [
    ...PLATFORMS
      .filter(p => socials[p.key])
      .map(p => ({ ...p, url: socials[p.key] })),
    ...(website ? [{ key: 'web', label: 'Sitio web', Icon: Globe, color: accent, url: website }] : [])
  ];

  if (!links.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400">
        <p className="text-3xl mb-2">🔗</p>
        <p className="text-sm">Sin redes sociales configuradas</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
        <span style={{ color: accent }}>🔗</span>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Síguenos</h3>
      </div>

      <div className="p-4 flex flex-wrap gap-3">
        {links.map(({ key, label, Icon, color, url }) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all hover:-translate-y-0.5 text-sm font-medium"
            style={{ color }}
          >
            <Icon className="h-4 w-4" />
            {label}
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        ))}
      </div>
    </div>
  );
}
