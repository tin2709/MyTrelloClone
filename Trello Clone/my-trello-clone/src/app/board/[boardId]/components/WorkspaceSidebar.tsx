'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuLayoutGrid,
    LuUser,
    LuSettings,
    LuChevronDown,
    LuList,
    LuCalendar,
    LuPlus,
    LuChevronLeft
} from 'react-icons/lu';

interface WorkspaceSidebarProps {
    workspaceName: string;
    activeBoardName: string;
}

export const WorkspaceSidebar = ({ workspaceName, activeBoardName }: WorkspaceSidebarProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(true);

    return (
        <aside className="w-64 border-r border-gray-200 p-2 flex flex-col shrink-0 bg-purple-800 text-white">
            {/* Workspace Info */}
            <div className="p-2">
                <Link
                    href={`/dashboard`} // Giả sử bạn có trang dashboard
                    className="flex items-center gap-2 w-full hover:bg-purple-700/50 p-2 rounded-md"
                >
                    <div className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center rounded-md font-bold text-xl">
                        {workspaceName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-sm text-gray-100">{workspaceName}</p>
                        <p className="text-xs text-gray-400">Miễn phí</p>
                    </div>
                    <LuChevronLeft className="ml-auto text-gray-400" />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-grow space-y-1 px-2">
                <Link href="#" className="flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-gray-200 hover:bg-purple-700/50">
                    <LuLayoutGrid className="text-lg" /> Bảng
                </Link>
                <Link href="#" className="flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-gray-200 hover:bg-purple-700/50">
                    <LuUser className="text-lg" /> Thành viên <LuPlus className="ml-auto"/>
                </Link>
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="w-full flex items-center justify-between p-2 text-sm font-semibold text-gray-200 hover:bg-purple-700/50 rounded-md"
                >
                    <div className="flex items-center gap-3">
                        <LuSettings className="text-lg" />
                        <span>Các cài đặt Không gian làm việc</span>
                    </div>
                    <LuChevronDown className={`transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSettingsOpen && (
                    <div className="pl-5 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 pt-2 pb-1 px-2">
                            Dạng xem Không gian làm việc
                        </p>
                        <Link href="#" className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left text-gray-200 hover:bg-purple-700/50">
                            <LuList className="text-lg"/> Bảng
                        </Link>
                        <Link href="#" className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left text-gray-200 hover:bg-purple-700/50">
                            <LuCalendar className="text-lg"/> Lịch
                        </Link>
                    </div>
                )}
                <div className="border-t border-purple-700 my-2"></div>
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-bold text-gray-200">Các bảng của bạn</h3>
                    <button className="p-1 hover:bg-purple-700/50 rounded-md"><LuPlus /></button>
                </div>
                {/* Active Board */}
                <button className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left bg-purple-600 text-white">
                    <div className="w-6 h-6 bg-fuchsia-700 rounded-sm"></div>
                    {activeBoardName}
                </button>
            </nav>

            {/* Premium Button */}
            <div className="p-2 mt-auto">
                <button className="w-full bg-purple-100/20 text-white p-2 rounded-md text-sm font-semibold hover:bg-purple-100/30">
                    Dùng thử Premium miễn phí
                </button>
            </div>
        </aside>
    );
};