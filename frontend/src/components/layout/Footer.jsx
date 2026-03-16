import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bot, Github, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  const linkColumns = [
    {
      title: t('footer.projects'),
      links: [
        { to: '/competitions', label: t('footer.competitions') },
        { to: '/teams', label: t('footer.teams') },
        { to: '/streams', label: t('footer.streaming') },
      ],
    },
    {
      title: t('footer.resources'),
      links: [
        { to: '/sponsors', label: t('footer.sponsors') },
        { to: '/gallery', label: t('footer.gallery') },
        { to: '/feedback', label: t('footer.feedback') },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { to: '#', label: t('footer.about'), isAnchor: true },
        { to: '/contact', label: t('footer.contact') },
        { to: '/terms', label: t('footer.terms') },
      ],
    },
  ];

  const socials = [
    {
      href: 'https://x.com/robeurope-robotics',
      label: t('footer.social.twitter'),
      icon: <Twitter className="h-5 w-5" />,
    },
    {
      href: 'https://github.com/s-pl/RobEurope',
      label: t('footer.social.github'),
      icon: <Github className="h-5 w-5" />,
    },
    {
      href: 'https://es.linkedin.com/robeurope',
      label: t('footer.social.linkedin'),
      icon: <Linkedin className="h-5 w-5" />,
    },
  ];

  return (
    <footer className="w-full border-t border-stone-200 bg-white dark:bg-stone-950 dark:border-stone-800">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-[#f8f7f4] text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <span
                className="text-sm font-semibold text-stone-900 dark:text-stone-50"
                style={{ fontFamily: 'var(--font-display, inherit)' }}
              >
                RobEurope
              </span>
            </div>

            <p
              className="mt-5 text-sm leading-relaxed text-stone-500 dark:text-stone-400"
              style={{ fontFamily: 'var(--font-body, inherit)' }}
            >
              {t('footer.description')}
            </p>

            {/* Social icons */}
            <div className="mt-5 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition-colors duration-150 hover:border-blue-300 hover:text-blue-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-blue-600 dark:hover:text-blue-400"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {linkColumns.map((col) => (
            <div key={col.title}>
              <h2
                className="text-xs font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-50"
                style={{ fontFamily: 'var(--font-display, inherit)' }}
              >
                {col.title}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.isAnchor ? (
                      <a
                        href={link.to}
                        className="text-stone-500 transition-colors duration-150 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-stone-500 transition-colors duration-150 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-stone-200 py-5 dark:border-stone-800">
          <p className="text-center text-xs text-stone-500 dark:text-stone-400 md:text-sm">
            Copyright {new Date().getFullYear()} &copy;{' '}
            <a href="#" className="hover:text-stone-700 dark:hover:text-stone-300">
              Samuel Ponce Luna &amp; Angel Lallave Herrera
            </a>
            . {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
