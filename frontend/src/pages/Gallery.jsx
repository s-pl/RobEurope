import { useTranslation } from 'react-i18next';
import { useState } from "react"

const Gallery = () => {

    const [showMore, setShowMore] = useState(false)
    const { t } = useTranslation();

    return (
        <div>

            <div>
                <h1 className="text-8xl font-bold text-blue-800 mb-2 mt-10 text-center drop-shadow-md">
                    {t("gallery.galleryTitle")}
                </h1>
                <p className="text-blue-600 text-lg mb-10 text-center">
                    {t('gallery.galleryDescription')}
                </p>
            </div>

            <div className="flex justify-center items-start min-h-screen mt-20">

                <div className="bg-blue-200/30 backdrop-blur-md rounded-2xl shadow-lg p-20">

                    <div className="grid grid-cols-4 gap-16">
                        {[...Array(8)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-44 h-44 bg-white dark:bg-slate-950 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 hover:scale-105 transition-all duration-300"
                            />
                        ))}
                    </div>

                    <div className="flex justify-center mt-10">
                        <button 
                            onClick={() => setShowMore(!showMore)}
                            className="text-blue-800 hover:text-blue-600 transition"
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`w-10 h-10 transition-transform duration-300 ${showMore ? "rotate-180" : ""}`}
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor" 
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {showMore && (
                        <div className="grid grid-cols-4 gap-16 mt-10 animate-fadeIn">
                            {[...Array(8)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-44 h-44 bg-white dark:bg-slate-950 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 hover:scale-105 transition-all duration-300"
                                />
                            ))}
                        </div>
                    )}

                </div>
            </div>

        </div>
    )
}

export default Gallery
