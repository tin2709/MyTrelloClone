// src/app/board/[boardId]/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuLayoutGrid, LuUser, LuSettings, LuChevronDown, LuList, LuCalendar,
    LuPlus, LuChevronLeft, LuStar, LuUsers, LuArmchair, LuFilter, LuMoveHorizontal, LuMessageSquare, LuPaperclip
} from 'react-icons/lu';

// --- DATA GIẢ LẬP ---
// Trong ứng dụng thật, bạn sẽ fetch dữ liệu này dựa trên `params.boardId`
const boardData = {
    id: '1',
    name: 'Bảng Trello của tôi',
    workspace: {
        id: '2025_23_06_id',
        name: '2025_23_06'
    },
    lists: [
        {
            id: 'list-1',
            title: 'Cần làm',
            cards: [
                { id: 'card-1', title: 'Lập kế hoạch dự án' },
                { id: 'card-2', title: 'Họp khởi động' },
            ]
        },
        {
            id: 'list-2',
            title: 'Đang làm',
            cards: []
        },
        {
            id: 'list-3',
            title: 'Xong',
            cards: []
        }
    ]
};

// --- CÁC COMPONENT PHỤ CHO TRANG BẢNG ---

// Sidebar dành riêng cho Workspace (Có thể tái sử dụng từ các trang khác)
const WorkspaceSidebar = ({ workspaceName, activeBoardName }: { workspaceName: string, activeBoardName: string }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(true);

    return (
        <aside className="w-64 border-r border-gray-200 p-2 flex flex-col shrink-0 bg-purple-800 text-white">
            <div className="p-2">
                <Link href={`/dashboard`} className="flex items-center gap-2 w-full hover:bg-purple-700/50 p-2 rounded-md">
                    <div className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center rounded-md font-bold text-xl">2</div>
                    <div className="text-left">
                        <p className="font-bold text-sm text-gray-100">{workspaceName}</p>
                        <p className="text-xs text-gray-400">Miễn phí</p>
                    </div>
                    <LuChevronLeft className="ml-auto text-gray-400" />
                </Link>
            </div>
            <nav className="flex-grow space-y-1 px-2">
                <Link href="#" className="flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-gray-200 hover:bg-purple-700/50">
                    <LuLayoutGrid className="text-lg" /> Bảng
                </Link>
                <Link href="#" className="flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-gray-200 hover:bg-purple-700/50">
                    <LuUser className="text-lg" /> Thành viên
                    <LuPlus className="ml-auto"/>
                </Link>
                <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-full flex items-center justify-between p-2 text-sm font-semibold text-gray-200 hover:bg-purple-700/50 rounded-md">
                    <div className="flex items-center gap-3">
                        <LuSettings className="text-lg" />
                        <span>Các cài đặt Không gian làm việc</span>
                    </div>
                    <LuChevronDown className={`transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSettingsOpen && (
                    <div className="pl-5 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 pt-2 pb-1 px-2">Dạng xem Không gian làm việc</p>
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
                {/* Highlight bảng đang active */}
                <button className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left bg-purple-600 text-white">
                    <div className="w-6 h-6 bg-fuchsia-700 rounded-sm"></div> {activeBoardName}
                </button>
            </nav>
            <div className="p-2 mt-auto">
                <button className="w-full bg-purple-100/20 text-white p-2 rounded-md text-sm font-semibold hover:bg-purple-100/30">
                    Dùng thử Premium miễn phí
                </button>
            </div>
        </aside>
    );
}

// Header của Bảng
const BoardHeader = ({ boardName }: { boardName: string }) => (
    <div className="p-3 flex items-center gap-4 text-white bg-black/20 backdrop-blur-sm">
        <h1 className="text-xl font-bold">{boardName}</h1>
        <button className="p-2 rounded-md hover:bg-white/20"><LuStar /></button>
        <div className="w-px h-6 bg-white/30"></div>
        <button className="flex items-center gap-2 p-2 rounded-md hover:bg-white/20"><LuUsers/> Hiển thị với Không gian làm việc</button>
        <button className="flex items-center gap-2 p-2 bg-white/20 rounded-md font-semibold"><LuArmchair/> Bảng</button>
    </div>
)

// Header Phụ (Bộ lọc, Chia sẻ)
const BoardSubHeader = () => (
    <div className="p-3 flex items-center justify-between text-white bg-black/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 p-2 rounded-md hover:bg-white/20"><LuArmchair /> Dạng xem bảng</button>
            <div className="w-px h-6 bg-white/30"></div>
            <button className="flex items-center gap-2 p-2 rounded-md hover:bg-white/20"><LuFilter /> Bộ lọc</button>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 flex items-center justify-center rounded-full font-bold text-sm border-2 border-white">PT</div>
            <button className="bg-white text-gray-800 font-semibold px-4 py-2 rounded-md text-sm">Chia sẻ</button>
            <button className="p-2 rounded-md hover:bg-white/20"><LuMoveHorizontal/></button>
        </div>
    </div>
)

// Card trong cột Kanban
const KanbanCard = ({ card }: { card: { id: string, title: string }}) => (
    <Link href={`/board/1/card/${card.id}`} scroll={false}>
    <div className="bg-white rounded-md p-2.5 shadow-sm mb-2 cursor-pointer hover:bg-gray-50">
        <p className="text-sm text-gray-800">{card.title}</p>
        <div className="flex items-center gap-3 mt-2 text-gray-500">
            <LuMessageSquare size={14}/>
            <LuPaperclip size={14}/>
        </div>
    </div>
    </Link>
)

// Cột Kanban
const KanbanList = ({ list }: { list: typeof boardData.lists[0] }) => (
    <div className="w-72 bg-gray-100 rounded-lg p-2 shrink-0 h-fit">
        <div className="flex justify-between items-center p-2 mb-2">
            <h3 className="font-semibold text-gray-700">{list.title}</h3>
            <button className="p-1.5 hover:bg-gray-300 rounded-md"><LuMoveHorizontal/></button>
        </div>
        <div className="px-1">
            {list.cards.map(card => <KanbanCard key={card.id} card={card}/>)}
        </div>
        <button className="w-full text-left p-2 mt-1 hover:bg-gray-200 rounded-md text-gray-600 flex items-center gap-2">
            <LuPlus/> Thêm thẻ
        </button>
    </div>
)


// --- COMPONENT CHÍNH CỦA TRANG BẢNG ---
export default function BoardPage({ }: { params: { boardId: string } }) {
    // Dữ liệu được giả lập, trong ứng dụng thật sẽ fetch dựa trên params.boardId
    const { name, workspace, lists } = boardData;

    return (
        <div className="h-screen w-screen flex flex-col font-sans">
            {/* Header chung của ứng dụng */}
            <header className="bg-purple-800/80 backdrop-blur-sm shadow-sm p-2 flex justify-between items-center shrink-0 z-10 border-b border-purple-700 text-white">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="p-2 rounded hover:bg-white/20"><LuLayoutGrid className="text-2xl" /></Link>
                    <div className="hidden md:flex items-center gap-1">
                        <button className="px-3 py-1.5 text-sm font-semibold rounded hover:bg-white/20">Các không gian làm việc <LuChevronDown className="inline-block ml-1" /></button>
                        {/* ... các nút header khác */}
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700">
                        Tạo mới
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <input type="search" placeholder="Tìm kiếm" className="bg-white/20 placeholder:text-gray-300 px-3 py-1.5 border-none rounded-md text-sm hidden md:block" />
                    <div className="w-8 h-8 bg-gray-700 flex items-center justify-center rounded-full font-bold text-sm">PT</div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <WorkspaceSidebar workspaceName={workspace.name} activeBoardName={name}/>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col bg-fuchsia-200" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2070')`, backgroundSize: 'cover' }}>
                    <BoardHeader boardName={name} />
                    <BoardSubHeader />
                    <div className="flex-1 overflow-x-auto p-4">
                        <div className="flex gap-4 h-full items-start">
                            {lists.map(list => <KanbanList key={list.id} list={list} />)}
                            <button className="w-72 p-2.5 rounded-lg bg-white/30 hover:bg-white/40 text-white font-semibold text-left shrink-0">
                                <LuPlus className="inline-block mr-2"/>
                                Thêm danh sách khác
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}