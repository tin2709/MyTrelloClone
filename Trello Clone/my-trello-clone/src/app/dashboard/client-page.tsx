// src/app/dashboard/client-page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateBoardModal from '@/app/dashboard/CreateBoardModal'; // Giả sử modal ở components
import LogoutButton from '@/components/LogoutButton';
import useTailwindBreakpoint from '@/app/hooks/use-tailwind-breakpoint';
import clsx from 'clsx';
import type { User } from '@supabase/supabase-js';

// --- Icons ---
import { BsTrello } from 'react-icons/bs';
import { LuPlus, LuLayoutGrid, LuMenu, LuX } from 'react-icons/lu';
import { FiChevronDown } from 'react-icons/fi';


// --- Định nghĩa Types ---
interface Board { id: string; title: string; }
interface Workspace { id: string; name: string; boards: Board[]; }

// --- Component con: Thẻ Board ---
const BoardCard = ({ title, bgClass, onClick }: { title: string; bgClass: string; onClick: () => void }) => (
    <Link href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className={`h-24 rounded-md p-3 text-white font-bold flex items-end ${bgClass} hover:opacity-90 transition-opacity`}>
        {title}
    </Link>
);

// --- Component con: Mục Workspace trên Sidebar ---
const WorkspaceSidebarItem = ({ workspace }: { workspace: Workspace }) => {
    const initial = workspace.name?.charAt(0).toUpperCase() || 'W';
    const colors = ['bg-green-600', 'bg-red-500', 'bg-purple-600', 'bg-blue-500', 'bg-orange-500'];
    const bgColor = colors[initial.charCodeAt(0) % colors.length];

    return (
        <div>
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-blue-100 cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 ${bgColor} text-white flex items-center justify-center rounded-md font-bold text-sm`}>{initial}</div>
                    <span className="font-semibold text-sm text-gray-700">{workspace.name}</span>
                </div>
                <FiChevronDown className="text-gray-500" />
            </div>
        </div>
    );
};

// --- Component con: Trạng thái rỗng ---
const EmptyState = ({ onOpenModal }: { onOpenModal: () => void }) => (
    <div className="w-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
        <LuLayoutGrid size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Chào mừng đến với Trello!</h2>
        <p className="text-gray-500 mt-2 mb-6 max-w-sm">
            Có vẻ như bạn chưa có không gian làm việc nào. <br /> Hãy bắt đầu bằng cách tạo bảng đầu tiên của bạn.
        </p>
        <button onClick={onOpenModal} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700">
            <LuPlus className="inline -mt-1 mr-1" /> Tạo bảng mới
        </button>
    </div>
);


interface DashboardClientProps {
    user: User | null; // SỬA ĐỔI: Nhận toàn bộ đối tượng user
    workspaces: Workspace[];
}

export default function DashboardClient({ user, workspaces }: DashboardClientProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // THÊM MỚI: State cho sidebar trên mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const breakpoint = useTailwindBreakpoint();
    const bgColors = ["bg-green-600", "bg-pink-600", "bg-blue-800", "bg-teal-600", "bg-purple-600", "bg-orange-500"];

    return (
        <div className="h-screen w-screen flex flex-col font-sans bg-gray-50 overflow-hidden">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm shadow-sm p-2 border-b flex justify-between items-center shrink-0 z-20">
                <div className="flex items-center gap-2">
                    {/* THÊM MỚI: Nút Hamburger cho mobile */}
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-md hover:bg-gray-200">
                        <LuMenu size={20} />
                    </button>
                    <Link href="/dashboard" className="hidden sm:block"><BsTrello className="text-2xl text-blue-600" /></Link>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center gap-1.5"
                    >
                        <LuPlus size={16} />
                        {breakpoint !== 'xs' && <span>Tạo mới</span>}
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <input type="search" placeholder="Tìm kiếm" className="px-3 py-1.5 border rounded-md text-sm hidden lg:block" />
                    <div className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center rounded-full font-bold text-sm">
                        {user?.email?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <LogoutButton />
                </div>
            </header>

            <div className="flex flex-1 relative overflow-hidden">
                {/* SỬA ĐỔI: Sidebar với logic responsive */}
                <aside className={clsx(
                    "absolute md:relative h-full w-64 bg-gray-50 p-4 border-r border-gray-200 shrink-0 z-10 transition-transform duration-300 ease-in-out",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                    {/* Nút đóng sidebar trên mobile */}
                    <button onClick={() => setIsSidebarOpen(false)} className="absolute top-2 right-2 md:hidden p-2 rounded-full hover:bg-gray-200">
                        <LuX size={20}/>
                    </button>
                    <nav className="flex flex-col gap-1 text-sm mt-8 md:mt-0">{/* ... Menu ... */}</nav>
                    <hr className="my-4" />
                    <h2 className="font-bold text-xs text-gray-500 px-2 mb-2">CÁC KHÔNG GIAN LÀM VIỆC</h2>
                    <div className="flex flex-col gap-1">
                        {workspaces?.map(ws => <WorkspaceSidebarItem key={ws.id} workspace={ws} />)}
                    </div>
                </aside>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {/* SỬA ĐỔI: Xử lý trạng thái rỗng */}
                    {workspaces.length === 0 ? (
                        <EmptyState onOpenModal={() => setIsModalOpen(true)} />
                    ) : (
                        <div className="space-y-12">
                            {workspaces.map(ws => (
                                <section key={ws.id}>
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">{ws.name}</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {ws.boards.map((board, index) => (
                                            <BoardCard key={board.id} title={board.title} bgClass={bgColors[(index + 1) % bgColors.length]} onClick={() => alert(`Clicked on ${board.title}`)} />
                                        ))}
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="h-24 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm text-gray-600 cursor-pointer font-medium"
                                        >
                                            <LuPlus className="mr-2" /> Tạo bảng mới
                                        </button>
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal giữ nguyên */}
            <CreateBoardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                workspaces={workspaces}
            />
        </div>
    );
}