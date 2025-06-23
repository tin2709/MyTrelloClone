// src/app/dashboard/client-page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateBoardModal from '@/app/dashboard/CreateBoardModal'; // Import modal

// --- Icons ---
import { BsTrello } from 'react-icons/bs';
import { LuPlus } from 'react-icons/lu';
import { FiChevronDown } from 'react-icons/fi';
import LogoutButton from '@/components/LogoutButton';

// Copy các type và component phụ từ file page.tsx cũ
interface Board {
    id: string;
    title: string;
}
interface Workspace {
    id: string;
    name: string;
    boards: Board[];
}
const BoardCard = ({ title, bgClass }: { title: string; bgClass: string }) => (
    <div className={`h-24 rounded-md p-3 text-white font-bold flex items-end ${bgClass}`}>{title}</div>
);
const WorkspaceSidebarItem = ({ workspace }: { workspace: Workspace }) => {
    const initial = workspace.name?.charAt(0).toUpperCase() || 'W';
    return (
        <div>
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-blue-100 cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-green-600 text-white flex items-center justify-center rounded-md font-bold text-sm">{initial}</div>
                    <span className="font-semibold text-sm text-gray-700">{workspace.name}</span>
                </div>
                <FiChevronDown className="text-gray-500" />
            </div>
        </div>
    );
};
// --- Hết phần copy ---

interface DashboardClientProps {
    userInitial: string;
    workspaces: Workspace[];
}

export default function DashboardClient({ userInitial, workspaces }: DashboardClientProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // const allBoards = workspaces?.flatMap(ws => ws.boards) || [];
    const bgColors = ["bg-green-600", "bg-pink-600", "bg-blue-800", "bg-teal-600", "bg-purple-600", "bg-orange-500"];

    return (
        <>
            <div className="h-screen w-screen flex flex-col font-sans">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-sm shadow-sm p-3 flex justify-between items-center shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard"><BsTrello className="text-2xl text-blue-600" /></Link>
                        {/* Nút Tạo mới ở Header */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700"
                        >
                            Tạo mới
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <input type="search" placeholder="Tìm kiếm" className="px-3 py-1.5 border rounded-md text-sm hidden md:block" />
                        <div className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center rounded-full font-bold text-sm">{userInitial}</div>
                        <LogoutButton />
                    </div>
                </header>

                <div className="flex flex-1 overflow-y-auto">
                    {/* Sidebar */}
                    <aside className="w-64 bg-gray-50 p-4 border-r border-gray-200 shrink-0">
                        <nav className="flex flex-col gap-1 text-sm">{/* ... Giữ nguyên ... */}</nav>
                        <hr className="my-4" />
                        <h2 className="font-bold text-xs text-gray-500 px-2 mb-2">Các Không gian làm việc</h2>
                        <div className="flex flex-col gap-1">
                            {workspaces?.map(ws => <WorkspaceSidebarItem key={ws.id} workspace={ws} />)}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white">
                        {/* ... Các section giữ nguyên ... */}
                        {workspaces?.map(ws => (
                            <section key={ws.id} className="mt-12">
                                <h2 className="text-lg font-bold text-gray-700 mb-4">{ws.name}</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {ws.boards.map((board, index) => (
                                        <BoardCard key={board.id} title={board.title} bgClass={bgColors[(index + 1) % bgColors.length]} />
                                    ))}
                                    {/* Nút Tạo bảng mới trong từng workspace */}
                                    <div
                                        onClick={() => setIsModalOpen(true)}
                                        className="h-24 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm text-gray-700 cursor-pointer"
                                    >
                                        <LuPlus className="mr-2" /> Tạo bảng mới
                                    </div>
                                </div>
                            </section>
                        ))}
                    </main>
                </div>
            </div>

            {/* Render Modal */}
            <CreateBoardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                workspaces={workspaces}
            />
        </>
    );
}