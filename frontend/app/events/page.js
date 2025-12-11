import Link from 'next/link';

export default function Events() {
    return (
        <div id="webcrumbs">
            <div className="w-full max-w-[1440px] mx-auto bg-gradient-to-b from-purple-900 to-purple-700 min-h-screen px-4 sm:px-6 lg:px-8">
                <header className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">POAP Events</h1>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative w-full sm:w-auto">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-purple-300">search</span>
                                <input type="text" placeholder="Search events..." className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-full bg-white/10 backdrop-blur-lg border border-purple-400/30 text-white placeholder-purple-200 outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300" />
                            </div>
                            <details className="relative">
                                <summary className="list-none cursor-pointer px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">filter_list</span>
                                    Filter
                                </summary>
                                <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-purple-400/30 z-10">
                                    <div className="space-y-3">
                                        <label className="block text-white">
                                            <input type="checkbox" className="mr-2 accent-purple-500" />
                                            Upcoming Events
                                        </label>
                                        <label className="block text-white">
                                            <input type="checkbox" className="mr-2 accent-purple-500" />
                                            Past Events
                                        </label>
                                        <label className="block text-white">
                                            <input type="checkbox" className="mr-2 accent-purple-500" />
                                            Virtual Events
                                        </label>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </header>

                <main className="px-4 sm:px-6 lg:px-8 pb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer group">
                                <div className="relative mb-4">
                                    <div className="w-full aspect-video bg-purple-400/20 rounded-xl overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-br from-purple-600/50 to-purple-800/50" />
                                    </div>
                                    <span className="absolute top-3 right-3 bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
                                        {i % 2 === 0 ? 'Upcoming' : 'Past'}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">Web3 Conference #{i}</h3>
                                <div className="flex items-center gap-2 text-purple-200 mb-3">
                                    <span className="material-symbols-outlined">calendar_month</span>
                                    <span>2023-{i}-01</span>
                                </div>
                                <div className="flex items-center gap-2 text-purple-200 mb-4">
                                    <span className="material-symbols-outlined">location_on</span>
                                    <span>{i % 2 === 0 ? 'Virtual Event' : 'New York, USA'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-purple-200">
                                        <span className="font-semibold text-white">{50 * i}</span> Attendees
                                    </span>
                                    <Link href="/claim-poap" className="px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors">
                                        Claim POAP
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center mt-8">
                        <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-purple-600 transition-colors flex items-center justify-center text-white">1</button>
                            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-purple-600 transition-colors flex items-center justify-center text-white">2</button>
                            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-purple-600 transition-colors flex items-center justify-center text-white">3</button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}