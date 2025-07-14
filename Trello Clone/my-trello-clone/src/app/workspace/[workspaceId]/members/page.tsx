'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuLayoutGrid, LuUser, LuSettings, LuChevronDown, LuList, LuCalendar,
    LuPlus, LuChevronLeft, LuPencil, LuLock, LuLink, LuX, LuBell, LuChevronRight
} from 'react-icons/lu';
import useTailwindBreakpoint from '@/app/hooks/use-tailwind-breakpoint'; // <-- Cập nhật đường dẫn đến hook

type WorkspaceMembersPageProps = {
    params: {
        workspaceId: string;
    };
    searchParams: { [key: string]: string | string[] | undefined };
};
// Component cho Sidebar dành riêng cho Workspace
const WorkspaceSidebar = ({ workspaceId, workspaceName, isCollapsed, toggleSidebar }: {
    workspaceId: string,
    workspaceName: string,
    isCollapsed: boolean,
    toggleSidebar: () => void
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(true);

    React.useEffect(() => {
        if (isCollapsed) {
            setIsSettingsOpen(false);
        }
    }, [isCollapsed]);

    return (
        <aside className={`border-r border-gray-200 p-2 flex flex-col shrink-0 bg-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="p-2">
                {/* Nút này sẽ gọi hàm toggleSidebar mỗi khi được click */}
                <button onClick={toggleSidebar} className="flex items-center gap-2 w-full hover:bg-gray-100 p-2 rounded-md">
                    <div className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center rounded-md font-bold text-xl shrink-0">2</div>
                    <div className={`text-left overflow-hidden transition-opacity ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                        <p className="font-bold text-sm text-gray-800 truncate">{workspaceName}</p>
                        <p className="text-xs text-gray-500">Miễn phí</p>
                    </div>
                    {/* Icon sẽ thay đổi giữa trái và phải tùy theo trạng thái */}
                    <div className="ml-auto shrink-0">
                        {isCollapsed ? <LuChevronRight className="text-gray-500" /> : <LuChevronLeft className="text-gray-500" />}
                    </div>
                </button>
            </div>
            <nav className={`flex-grow space-y-1 px-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                <Link href={`/workspace/${workspaceId}/boards`} className={`flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-200 ${isCollapsed ? 'justify-center' : ''}`}>
                    <LuLayoutGrid className="text-lg shrink-0" /> <span className={isCollapsed ? 'hidden' : ''}>Bảng</span>
                </Link>
                <button className={`w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left bg-blue-100 text-blue-800 ${isCollapsed ? 'justify-center' : ''}`}>
                    <LuUser className="text-lg shrink-0" /> <span className={isCollapsed ? 'hidden' : ''}>Thành viên</span>
                </button>
                {!isCollapsed && (
                    <>
                        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-full flex items-center justify-between p-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-md">
                            <div className="flex items-center gap-3">
                                <LuSettings className="text-lg" />
                                <span>Các cài đặt KGLV</span>
                            </div>
                            <LuChevronDown className={`transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSettingsOpen && (
                            <div className="pl-5 space-y-1">
                                <p className="text-xs font-semibold text-gray-500 pt-2 pb-1 px-2">Dạng xem Không gian làm việc</p>
                                <button className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left text-gray-700 hover:bg-gray-200">
                                    <LuList className="text-lg"/> Bảng
                                </button>
                                <button className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left text-gray-700 hover:bg-gray-200">
                                    <LuCalendar className="text-lg"/> Lịch
                                </button>
                            </div>
                        )}
                        <div className="border-t my-2"></div>
                        <button className="w-full flex items-center justify-between p-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-md">
                            <div className="flex items-center gap-3"><LuPlus className="text-lg"/> <span>Các bảng của bạn</span></div>
                            <LuPlus/>
                        </button>
                        <button className="w-full flex items-center justify-between p-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-md">
                            <div className="flex items-center gap-3"><LuChevronDown className="text-lg"/> <span>Hiển thị nhiều hơn</span></div>
                            <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">1</span>
                        </button>
                    </>
                )}
            </nav>
            <div className={`p-2 mt-auto ${isCollapsed ? 'hidden' : 'block'}`}>
                <button className="w-full bg-purple-100 text-purple-800 p-2 rounded-md text-sm font-semibold hover:bg-purple-200">
                    Dùng thử Premium miễn phí
                </button>
            </div>
        </aside>
    );
}

// Component cho Nội dung chính của trang Thành viên (Không đổi)
const MembersContent = ({ workspaceName }: { workspaceName: string }) => {
    const [activeTab, setActiveTab] = useState('members');

    return (
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
            <div className="w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-orange-500 text-white flex items-center justify-center rounded-lg font-bold text-3xl shrink-0">2</div>
                    <div className="flex-grow">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-800">{workspaceName}</h1>
                            <button className="p-1 rounded hover:bg-gray-200 text-gray-600"><LuPencil /></button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1"><LuLock size={12} className="inline-block mr-1"/> Riêng tư <span className="mx-1">•</span> <a href="#" target="_blank" rel="noopener noreferrer" className="hover:underline">www.facebook.com/</a></p>
                        <p className="text-sm text-gray-600 mt-1">Web</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 w-full md:w-auto justify-center">
                        <LuUser className="text-lg" /> Mời các thành viên
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Nav Tabs */}
                    <div className="w-full lg:w-56 shrink-0">
                        <h2 className="text-base font-semibold text-gray-700 mb-3">Người cộng tác <span className="font-normal text-gray-500">1 / 10</span></h2>
                        <nav className="space-y-1">
                            <button onClick={() => setActiveTab('members')} className={`w-full text-left p-2 rounded-md text-sm ${activeTab === 'members' ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>Thành viên không gian làm việc (1)</button>
                            <button onClick={() => setActiveTab('guests')} className={`w-full text-left p-2 rounded-md text-sm ${activeTab === 'guests' ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>Khách (0)</button>
                            <button onClick={() => setActiveTab('requests')} className={`w-full text-left p-2 rounded-md text-sm ${activeTab === 'requests' ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>Yêu cầu tham gia (0)</button>
                        </nav>
                        <div className="mt-6 p-4 bg-purple-600 text-white rounded-lg">
                            <h3 className="font-bold">Nâng cấp để kiểm soát nhiều quyền hơn</h3>
                            <p className="text-sm mt-2">Quyết định ai có thể gửi lời mời, chỉnh sửa cài đặt Không gian làm việc và hơn thế nữa với Premium.</p>
                            <a href="#" className="mt-3 block text-center text-sm font-semibold bg-white text-purple-700 px-3 py-1.5 rounded-md hover:bg-gray-100">Dùng thử Premium miễn phí trong 14 ngày</a>
                        </div>
                    </div>

                    {/* Right Content Pane */}
                    <div className="flex-1 bg-white p-6 rounded-lg border">
                        <div className="pb-4 border-b">
                            <h3 className="text-lg font-bold">Thành viên không gian làm việc (1)</h3>
                            <p className="text-sm text-gray-600 mt-1">Các thành viên trong Không gian làm việc có thể xem và tham gia tất cả các bảng Không gian làm việc hiển thị và tạo ra các bảng mới trong Không gian làm việc.</p>
                        </div>
                        <div className="py-4 border-b">
                            <h3 className="text-lg font-bold">Mời các thành viên tham gia cùng bạn</h3>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-1 gap-4">
                                <p className="text-sm text-gray-600 max-w-lg">Bất kỳ ai có liên kết mời đều có thể tham gia Không gian làm việc miễn phí này. Bạn có thể tắt và tạo liên kết mời mới bất cứ lúc nào.</p>
                                <button className="bg-gray-200 hover:bg-gray-300 text-sm font-semibold px-3 py-1.5 rounded-md flex items-center gap-2 justify-center shrink-0"><LuLink /> Mời bằng liên kết</button>
                            </div>
                        </div>
                        <div className="py-4">
                            <input type="text" placeholder="Lọc theo tên" className="w-full sm:w-64 px-3 py-1.5 border rounded-md text-sm mb-4" />
                            <ul>
                                <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 hover:bg-gray-100 rounded-md -mx-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-700 text-white flex items-center justify-center rounded-full font-bold shrink-0">PT</div>
                                        <div>
                                            <p className="font-semibold text-sm">Phạm Trung Tín</p>
                                            <p className="text-xs text-gray-500">@phmtrungtin8 • Lần hoạt động gần nhất May 2024</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md">Xem bảng (1)</button>
                                        <button className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md flex items-center gap-1">Quản trị viên <LuChevronDown size={14}/></button>
                                        <button className="p-2 hover:bg-gray-200 rounded-md text-gray-600"><LuX /></button>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}


// Component chính của trang
const WorkspaceMembersPage: React.FC<WorkspaceMembersPageProps> = ({ params }) => {
    const workspaceName = "2025_23_06";

    // Quản lý trạng thái đóng/mở
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    // Hàm đảo ngược trạng thái
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const breakpoint = useTailwindBreakpoint();
    const isMobile = breakpoint === 'xs';

    return (
        <div className="h-screen w-screen flex flex-col font-sans">
            {/* Header chung của ứng dụng */}
            <header className="bg-white shadow-sm p-2 flex justify-between items-center shrink-0 z-10 border-b">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="p-2 rounded hover:bg-gray-200 hidden md:block"><LuX className="text-2xl text-blue-600" /></Link>
                    <button className="p-2 rounded hover:bg-gray-200 md:hidden"><LuLayoutGrid className="text-xl text-gray-700"/></button>
                    <div className="hidden md:flex items-center gap-1">
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Các không gian làm việc <LuChevronDown className="inline-block ml-1" /></button>
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Gần đây <LuChevronDown className="inline-block ml-1" /></button>
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Đã đánh dấu sao <LuChevronDown className="inline-block ml-1" /></button>
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Mẫu <LuChevronDown className="inline-block ml-1" /></button>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center gap-1">
                        Tạo mới <LuPlus className="hidden md:inline-block"/>
                    </button>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <input type="search" placeholder="Tìm kiếm" className="px-3 py-1.5 border rounded-md text-sm hidden md:block" />
                    <button className="p-2 hover:bg-gray-200 rounded-full text-gray-600"><LuBell/></button>
                    <button className="p-2 hover:bg-gray-200 rounded-full text-gray-600"><LuUser/></button>
                    <div className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center rounded-full font-bold text-sm">PT</div>
                </div>
            </header>

            {/* Bố cục chính */}
            <div className="flex flex-1 overflow-hidden">
                {/* Ẩn sidebar trên mobile, hiển thị trên desktop/tablet */}
                {!isMobile && (
                    <WorkspaceSidebar
                        workspaceId={params.workspaceId}
                        workspaceName={workspaceName}
                        isCollapsed={isSidebarCollapsed}
                        toggleSidebar={toggleSidebar}
                    />
                )}
                <MembersContent workspaceName={workspaceName} />
            </div>
        </div>
    );
}
export default WorkspaceMembersPage;
