import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bot, Github, Twitter } from 'lucide-react';

const NAV_COLS = [
  {
    key: 'footer.explore',
    links: [
      { to: '/competitions', key: 'footer.competitions' },
      { to: '/teams',        key: 'footer.teams' },
      { to: '/streams',      key: 'footer.streaming' },
      { to: '/gallery',      key: 'footer.gallery' },
    ],
  },
  {
    key: 'footer.info',
    links: [
      { to: '/sponsors',            key: 'footer.sponsors' },
      { to: '/educational-centers', key: 'footer.centers' },
      { to: '/contact',             key: 'footer.contact' },
      { to: '/terms',               key: 'footer.terms' },
    ],
  },
];

const SOCIALS = [
  { href: 'https://x.com/robeurope-robotics',   label: 'Twitter / X', Icon: Twitter },
  { href: 'https://github.com/s-pl/RobEurope',  label: 'GitHub',      Icon: Github },
];

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t-4 border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-[1fr_auto_auto]">

          {/* Brand block */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2 w-fit">
              <Bot className="h-5 w-5 text-stone-900 dark:text-stone-100" aria-hidden="true" />
              <span className="font-black text-sm tracking-widest uppercase text-stone-900 dark:text-stone-100">
                RobEurope
              </span>
            </Link>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-[220px] leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3 mt-auto">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors duration-100"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLS.map((col) => (
            <div key={col.key} className="flex flex-col gap-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 dark:text-stone-500">
                {t(col.key)}
              </span>
              <nav className="flex flex-col gap-2">
                {col.links.map(({ to, key }) => (
                  <Link
                    key={to}
                    to={to}
                    className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors duration-100 w-fit"
                  >
                    {t(key)}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t-2 border-stone-100 dark:border-stone-800 py-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
            &copy; {year} RobEurope
          </span>
        </div>

      </div>
    </footer>
  );
}
