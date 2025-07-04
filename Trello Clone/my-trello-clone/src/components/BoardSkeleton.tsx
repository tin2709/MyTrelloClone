// components/BoardSkeleton.tsx

const SkeletonList = () => (
    <div className="w-72 h-48 bg-gray-700/50 rounded-lg shrink-0 p-3 flex flex-col gap-3">
        <div className="h-6 w-3/4 bg-gray-600/60 rounded"></div>
        <div className="h-10 w-full bg-gray-600/60 rounded"></div>
        <div className="h-10 w-full bg-gray-600/60 rounded"></div>
    </div>
);

export const BoardSkeleton = () => {
    return (
        <div className="h-screen w-screen flex flex-col font-sans bg-gray-900 animate-pulse">
            {/* Skeleton Header */}
            <header className="bg-purple-900/50 h-12 flex items-center justify-between px-4 shrink-0">
                <div className="h-6 w-48 bg-purple-800/70 rounded"></div>
                <div className="h-8 w-24 bg-purple-800/70 rounded"></div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                {/* Skeleton Workspace Sidebar */}
                <aside className="w-64 bg-gray-800/60 p-4 shrink-0">
                    <div className="h-6 w-32 bg-gray-700/70 rounded mb-6"></div>
                    <div className="h-8 w-full bg-gray-700/70 rounded"></div>
                </aside>
                {/* Skeleton Main Content */}
                <main className="flex-1 flex flex-col bg-cover bg-center min-w-0" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2070')` }}>
                    <div className="p-4 h-14 flex items-center justify-between">
                        <div className="h-7 w-56 bg-white/20 rounded"></div>
                        <div className="h-9 w-32 bg-white/20 rounded"></div>
                    </div>
                    <div className="flex-1 overflow-x-auto p-4">
                        <div className="flex gap-4 h-full items-start">
                            <SkeletonList />
                            <SkeletonList />
                            <SkeletonList />
                            <div className="w-72 p-2.5 rounded-lg bg-white/20 h-12 shrink-0"></div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};