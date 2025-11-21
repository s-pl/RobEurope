const Gallery = () => {

    return (
        <div>

            <div>
                <h1 className="text-8xl font-bold text-blue-800 mb-2 mt-10 text-center drop-shadow-md">
                    Gallery
                </h1>
                <p className="text-blue-600 text-lg mb-10 text-center">
                    A collection of our robotics event moments
                </p>
            </div>

            <div className="flex justify-center items-start min-h-screen mt-20">

                <div className="bg-blue-200/30 backdrop-blur-md rounded-2xl shadow-lg p-20">

                    <div className="grid grid-cols-4 gap-16">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="w-44 h-44 bg-white rounded-xl shadow-md border border-slate-200 hover:scale-105 transition-all duration-300"
                            />
                        ))}
                    </div>




                </div>
            </div>

        </div>
    )
}

export default Gallery
