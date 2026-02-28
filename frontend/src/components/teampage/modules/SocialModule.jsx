import { Globe, Instagram, Twitter, Youtube, Github, Linkedin, ExternalLink, Share2 } from 'lucide-react';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', Icon: Instagram, color: '#E1306C' },
  { key: 'twitter',   label: 'Twitter',   Icon: Twitter,   color: '#1DA1F2' },
  { key: 'youtube',   label: 'YouTube',   Icon: Youtube,   color: '#FF0000' },
  { key: 'github',    label: 'GitHub',    Icon: Github,    color: '#171515' },
  { key: 'linkedin',  label: 'LinkedIn',  Icon: Linkedin,  color: '#0A66C2' },
];

export default function SocialModule({ team, accentColor }) {
  const accent  = accentColor || '#18181b';
  const socials = team?.social_links || {};
  const website = team?.website_url;

  const links = [
    ...PLATFORMS
      .filter(p => socials[p.key])
      .map(p => ({ ...p, url: socials[p.key] })),
    ...(website ? [{ key: 'web', label: 'Sitio web', Icon: Globe, color: accent, url: website }] : []),
  ];

  if (!links.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
        <Share2 className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Sin redes sociales configuradas</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-zinc-400" />
        <h3 className="font-semibold text-zinc-900 text-sm">Redes sociales</h3>
      </div>

      <div className="p-4 flex flex-wrap gap-2">
        {links.map(({ key, label, Icon, color, url }) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all text-sm font-medium"
            style={{ color }}
          >
            <Icon className="h-4 w-4" />
            {label}
            <ExternalLink className="h-3 w-3 opacity-40" />
          </a>
        ))}
      </div>
    </div>
  );
}
