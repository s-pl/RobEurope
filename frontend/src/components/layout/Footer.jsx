import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="w-full border-t border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-slate-200/70 dark:border-slate-800">

                <div className="max-w-md">
                    <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400">
                            <Bot className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">RobEurope</span>
                    </div>
                    <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
                        {t('footer.description')}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <a href="https://x.com/robeurope-robotics" aria-label={t('footer.social.twitter')}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M19.167 2.5a9.1 9.1 0 0 1-2.617 1.275 3.733 3.733 0 0 0-6.55 2.5v.833a8.88 8.88 0 0 1-7.5-3.775s-3.333 7.5 4.167 10.833a9.7 9.7 0 0 1-5.834 1.667C8.333 20 17.5 15.833 17.5 6.25q0-.35-.067-.692A6.43 6.43 0 0 0 19.167 2.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                        <a href="https://github.com/s-pl/RobEurope" aria-label={t('footer.social.github')}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M7.5 15.833c-4.167 1.25-4.167-2.084-5.833-2.5m11.666 5v-3.225a2.8 2.8 0 0 0-.783-2.175c2.616-.292 5.366-1.283 5.366-5.833a4.53 4.53 0 0 0-1.25-3.125 4.22 4.22 0 0 0-.075-3.142s-.983-.292-3.258 1.233a11.15 11.15 0 0 0-5.833 0C5.225.541 4.242.833 4.242.833a4.22 4.22 0 0 0-.075 3.142 4.53 4.53 0 0 0-1.25 3.15c0 4.516 2.75 5.508 5.366 5.833a2.8 2.8 0 0 0-.783 2.15v3.225" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                        <a href="https://es.linkedin.com/robeurope" aria-label={t('footer.social.linkedin')}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M13.333 6.667a5 5 0 0 1 5 5V17.5H15v-5.833a1.667 1.667 0 0 0-3.334 0V17.5H8.333v-5.833a5 5 0 0 1 5-5M5 7.5H1.667v10H5zM3.333 5a1.667 1.667 0 1 0 0-3.333 1.667 1.667 0 0 0 0 3.333" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                </div>

                <div className="w-full md:w-1/2 flex flex-wrap md:flex-nowrap justify-between gap-10 md:gap-6">
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-5">{t('footer.projects')}
                        </h2>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-none">
                            <li><Link to="/competitions" className="hover:text-slate-900 dark:hover:text-slate-100">{t('footer.competitions')}</Link></li>
                            <li><Link to="/teams" className="hover:text-slate-900 dark:hover:text-slate-100">{t('footer.teams')}</Link></li>
                            <li><Link to="/streams" className="hover:text-slate-900 dark:hover:text-slate-100">{t('footer.streaming')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-5">{t('footer.resources')}</h2>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-none">
                            <li><Link to="/sponsors" className="hover:text-slate-900 dark:hover:text-slate-100">{t('footer.sponsors')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-5">{t('footer.company')}</h2>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-none">
                            <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">{t('footer.about')}</a></li>
                            <li><Link to="/contact" className="hover:text-slate-900 dark:hover:text-slate-100">{t('footer.contact')}</Link></li>
                            <li><Link to="/terms" className="hover:text-slate-900 dark:hover:text-slate-100">{t('footer.terms')}</Link></li>
                        </ul>
                    </div>
                </div>

            </div>
            <p className="py-4 text-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Copyright {new Date().getFullYear()} © <a href="#">Samuel Ponce Luna & Angel Lallave Herrera</a>. {t('footer.copyright')}
            </p>
            </div>
        </footer>
    );
};

export default Footer;