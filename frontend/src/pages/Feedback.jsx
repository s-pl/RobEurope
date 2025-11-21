import { useTranslation } from "react-i18next";

const Feedback = () => {
    const { t } = useTranslation();

    return (

        <div>
            <div class="">
                <h1 className="text-8xl font-bold text-blue-800 mb-2 mt-10 text-center drop-shadow-md">
                    {t('feedback.Title')}
                </h1>
                <p className="text-blue-600 text-lg mb-10 text-center">
                    {t('feedback.Description')}
                </p>
            </div>

            <div>
                <div className="flex justify-center items-start min-h-screen mt-20 space-x-20">

                    <div class="max-w-[720px] mx-auto mb-6">
                        <div class="block mb-4 mx-auto border-b border-slate-300 pb-2 max-w-[360px]">
                        </div>

                        <div class="bg-blue-200/30 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                            <div class="flex items-center gap-4 pb-8 mt-2">
                                <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=1480&q=80"
                                    alt="Samuel Ponce"
                                    class="h-[58px] w-[58px] rounded-full object-cover" />
                                <div class="flex flex-col gap-1 w-full">
                                    <div class="flex justify-between items-center">
                                        <h5 class="text-xl font-semibold text-blue-gray-900">Samuel Ponce</h5>
                                        <div class="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                                    class="w-5 h-5 text-yellow-700">
                                                    <path fill-rule="evenodd"
                                                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <p class="text-base font-light text-blue-gray-900">{t('feedback.roleSamuel')}</p>
                                </div>
                            </div>
                            <p class="text-base font-light text-blue-gray-900">
                                {t('feedback.reviewSamuel')}
                            </p>
                        </div>
                    </div>

                    <div class="max-w-[720px] mx-auto mb-6">
                        <div class="block mb-4 mx-auto border-b border-slate-300 pb-2 max-w-[360px]">
                        </div>

                        <div class="bg-blue-200/30 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                            <div class="flex items-center gap-4 pb-8 mt-2">
                                <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=1480&q=80"
                                    alt="Ángel Lallave"
                                    class="h-[58px] w-[58px] rounded-full object-cover" />
                                <div class="flex flex-col gap-1 w-full">
                                    <div class="flex justify-between items-center">
                                        <h5 class="text-xl font-semibold text-blue-gray-900">Ángel Lallave</h5>
                                        <div class="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                                    class="w-5 h-5 text-yellow-700">
                                                    <path fill-rule="evenodd"
                                                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <p class="text-base font-light text-blue-gray-900">{t('feedback.roleSamuel')}</p>
                                </div>
                            </div>
                            <p class="text-base font-light text-blue-gray-900">
                                {t('feedback.reviewAngel')}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    )
}

export default Feedback

