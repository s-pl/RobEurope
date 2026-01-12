import { useTranslation } from 'react-i18next';

const Feedback = () => {
    const { t } = useTranslation();

    return (

        <div className="space-y-8">
            <header className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-blue-900 sm:text-4xl lg:text-5xl dark:text-blue-100">
                    {t('feedback.Title')}
                </h1>
                <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
                    {t('feedback.Description')}
                </p>
            </header>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
                <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-start gap-4">
                        <img
                            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=1480&q=80"
                            alt="Samuel Ponce"
                            className="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800"
                        />

                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h5 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">Samuelillo Ponce</h5>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('feedback.roleSamuel')}</p>
                                </div>
                                <div className="flex shrink-0 gap-1" aria-label="5 stars">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="h-5 w-5 text-yellow-600"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="mt-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {t('feedback.reviewSamuel')}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-start gap-4">
                        <img
                            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=1480&q=80"
                            alt="Ángel Lallave"
                            className="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800"
                        />

                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h5 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">Ángel Lallave</h5>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('feedback.roleSamuel')}</p>
                                </div>
                                <div className="flex shrink-0 gap-1" aria-label="5 stars">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="h-5 w-5 text-yellow-600"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="mt-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {t('feedback.reviewAngel')}
                    </p>
                </div>
            </section>
        </div>
    )
}

export default Feedback