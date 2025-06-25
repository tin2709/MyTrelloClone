// src/app/dashboard/page.tsx (PHIÊN BẢN CẬP NHẬT - GIỮ NGUYÊN GIAO DIỆN, THÊM LOGIC TẠO WORKSPACE)
'use client';

import React, {useState, useEffect, useRef} from 'react';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// --- Icons ---
import { BsTrello } from 'react-icons/bs';
import {
    LuPlus, LuLayoutDashboard, LuChevronDown, LuX, LuLock, LuUsers, LuGlobe,
    LuLayoutGrid, LuHeart, LuUser, LuSettings, LuPencil,
     // Icon mới cho trạng thái loading
} from 'react-icons/lu';
import LogoutButton from '@/components/LogoutButton';

// --- Định nghĩa Types ---
interface Board { id: string; title: string; }
interface Workspace { id: string; name: string; boards: Board[]; }

// --- Component phụ: Mục trên Sidebar ---
const SidebarLink = ({ icon: Icon, text, active = false, onClick }: { icon: React.ElementType, text: string, active?: boolean, onClick?: () => void }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left ${active ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-200'}`}>
        <Icon className="text-lg" />
        <span>{text}</span>
    </button>
);

// --- Component phụ: Mục Workspace trên Sidebar ---
const WorkspaceSidebarItem = ({ workspace }: { workspace: Workspace }) => {
    const initial = workspace.name?.charAt(0).toUpperCase() || 'W';
    const colors = ['bg-green-600', 'bg-red-500', 'bg-purple-600', 'bg-blue-500', 'bg-orange-500'];
    const bgColor = colors[initial.charCodeAt(0) % colors.length];

    return (
        <div>
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-200 cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 ${bgColor} text-white flex items-center justify-center rounded-md font-bold text-sm`}>{initial}</div>
                    <span className="font-semibold text-sm text-gray-700">{workspace.name}</span>
                </div>
                <LuChevronDown className="text-gray-500" />
            </div>
        </div>
    );
};

// --- Component phụ: Dropdown Quyền xem ---
const VisibilityDropdown = () => {
    // ... (Không thay đổi)
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState({ value: 'workspace', title: 'Không gian làm việc', icon: LuUsers });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const options = [
        { value: 'private', title: 'Riêng tư', description: 'Chỉ thành viên bảng thông tin mới có quyền xem bảng thông tin này. Quản trị viên của Không gian làm việc có thể đóng bảng thông tin hoặc xóa thành viên.', icon: LuLock },
        { value: 'workspace', title: 'Không gian làm việc', description: 'Tất cả thành viên của Không gian làm việc có thể xem và sửa bảng thông tin này.', icon: LuUsers },
        { value: 'public', title: 'Công khai', description: 'Bất kỳ ai trên mạng internet đều có thể xem bảng thông tin này. Chỉ thành viên bảng mới có quyền sửa.', icon: LuGlobe },
    ];
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-gray-600 mb-1">Quyền xem</label>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left px-3 py-2 border border-blue-500 rounded-md bg-white ring-2 ring-blue-200">
                <span>{selected.title}</span>
                <LuChevronDown />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden">
                    {options.map(option => (
                        <div key={option.value} onClick={() => { setSelected(option); setIsOpen(false); }} className={`p-3 hover:bg-blue-100 cursor-pointer ${selected.value === option.value ? 'bg-blue-100' : ''}`}>
                            <div className="flex items-start gap-3">
                                <option.icon className="mt-1 text-gray-600" size={16} />
                                <div>
                                    <p className="font-semibold text-sm text-gray-800">{option.title}</p>
                                    <p className="text-xs text-gray-600">{option.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Component phụ: Form tạo bảng ---
const CreateBoardForm = ({ workspaces, onClose }: { workspaces: Workspace[], onClose: () => void }) => {
    // ... (Không thay đổi)
    const backgroundImages = [ "https://images.unsplash.com/photo-1615888279732-51139d7858c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80", "https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=900&q=60", "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80", ];
    const backgroundColors = ["#E2E8F0", "#3B82F6", "#1E40AF", "#4C1D95", "#6D28D9"];
    const [title, setTitle] = useState('');
    const [selectedBg, setSelectedBg] = useState({ type: 'image', value: backgroundImages[0] });
    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); alert(`Bảng "${title}" đã được tạo với nền đã chọn!`); onClose(); };
    return ( <div className="w-72 bg-white rounded-md shadow-lg border border-gray-200 z-50 mx-auto"> <div className="flex items-center justify-between p-2 border-b"> <button className="p-1 rounded hover:bg-gray-200 invisible"> <LuX size={20} /> </button> <h3 className="font-semibold text-sm text-gray-800">Tạo bảng</h3> <button onClick={onClose} className="p-1 rounded hover:bg-gray-200"> <LuX size={20} /> </button> </div> <div className="p-3"> <div className="flex justify-center mb-3"> <div className="w-48 h-28 bg-cover bg-center rounded-md p-1" style={{ backgroundColor: selectedBg.type === 'color' ? selectedBg.value : undefined, backgroundImage: selectedBg.type === 'image' ? `url(${selectedBg.value})` : undefined, }} > <div className="w-full h-full bg-black/10 flex items-center justify-center"> <Image src="/images/board-preview-skeleton.svg" alt="Preview" width={100} height={60} /> </div> </div> </div> <div className="mb-4"> <label className="block text-xs font-bold text-gray-600 mb-2">Phông nền</label> <div className="grid grid-cols-4 gap-1.5"> {backgroundImages.map(img => ( <button key={img} type="button" onClick={() => setSelectedBg({ type: 'image', value: img })} className="w-full h-8 bg-cover bg-center rounded-sm" style={{ backgroundImage: `url(${img})` }} /> ))} {backgroundColors.map(color => ( <button key={color} type="button" onClick={() => setSelectedBg({ type: 'color', value: color })} className="w-full h-8 rounded-sm" style={{ backgroundColor: color }} /> ))} <button type="button" className="w-full h-8 bg-gray-100 flex items-center justify-center rounded-sm text-gray-600">...</button> </div> </div> <form onSubmit={handleFormSubmit}> <div className="mb-4"> <label htmlFor="boardTitle" className="block text-xs font-bold text-gray-600 mb-1">Tiêu đề bảng <span className="text-red-500">*</span></label> <input type="text" id="boardTitle" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus /> </div> <div className="mb-4"> <label htmlFor="workspace" className="block text-xs font-bold text-gray-600 mb-1">Không gian làm việc</label> <select id="workspace" name="workspaceId" className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"> {workspaces.map(ws => ( <option key={ws.id} value={ws.id}>{ws.name}</option> ))} </select> </div> <div className="mb-4"> <VisibilityDropdown /> </div> <button type="submit" disabled={!title} className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"> Tạo mới </button> <button type="button" className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-md font-semibold"> Bắt đầu với Mẫu </button> </form> <p className="text-xs text-center text-gray-500 mt-3"> Bằng cách sử dụng hình ảnh từ Unsplash, bạn đồng ý với giấy phép và Điều khoản dịch vụ </p> </div> </div> );
}

// --- Component phụ: Nội dung chính khi không ở chế độ tạo ---
const DashboardHomeContent = ({ onCreateClick }: { onCreateClick: () => void }) => {
    return (
        <div className="flex-1 flex justify-center items-start pt-16">
            <div className="text-center max-w-lg p-8 border border-gray-200 rounded-lg bg-white shadow-sm">
                <Image src="/images/husky.svg" alt="Trello Husky" width={180} height={180} className="mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Theo dõi và cập nhật</h2>
                <p className="text-gray-600 mb-6">Mời mọi người vào bảng và thẻ, để lại nhận xét, thêm ngày hết hạn và chúng tôi sẽ hiển thị hoạt động quan trọng nhất ở đây.</p>
                <button onClick={onCreateClick} className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700">
                    Tạo Bảng đầu tiên của bạn
                </button>
            </div>
        </div>
    );
};

// --- *** CẬP NHẬT LỚN: COMPONENT NÀY GIỜ DÙNG ĐỂ TẠO WORKSPACE MỚI *** ---
interface EditWorkspaceFormProps {
    onCancel: () => void;
    onSuccess: () => void;
    supabase: SupabaseClient;
    user: User | null;
}
const EditWorkspaceForm = ({ onCancel, onSuccess, supabase, user }: EditWorkspaceFormProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) {
            alert('Tên không gian làm việc không được để trống.');
            return;
        }

        setIsSaving(true);
        try {
            // Bước 1: Insert vào bảng `Workspaces`
            // Gửi dữ liệu và dùng `.select().single()` để lấy lại record vừa tạo.
            const { data: workspaceData, error: workspaceError } = await supabase
                .from('Workspaces')
                .insert({
                    name: name.trim(),
                    description: description.trim(),
                    user_id: user.id // user_id của người tạo
                })
                .select()
                .single();

            if (workspaceError) {
                // RLS policy sẽ trả về lỗi nếu người dùng chưa đăng nhập.
                throw workspaceError;
            }

            // Bước 2: Insert vào bảng `Workspace_members`
            // Dùng ID từ workspace vừa tạo và gán vai trò 'admin'.
            const { error: memberError } = await supabase
                .from('Workspace_members')
                .insert({
                    workspace_id: workspaceData.id,
                    user_id: user.id,
                    role: 'admin'
                });

            if (memberError) {
                // Nếu bước này lỗi, lý tưởng nhất là nên xóa workspace vừa tạo (rollback).
                // Ở đây chúng ta tạm thời chỉ báo lỗi.
                throw memberError;
            }

            alert('Tạo không gian làm việc thành công!');
            onSuccess(); // Báo cho component cha để tải lại dữ liệu và chuyển view.

        } catch (error) { // Không dùng 'any' nữa
            console.error('Lỗi khi tạo không gian làm việc:', error);
            // Kiểm tra kiểu của error trước khi sử dụng
            let errorMessage = 'Đã xảy ra lỗi không mong muốn.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            alert(`Đã xảy ra lỗi: ${errorMessage}`);
        
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-md">
            {/* Giữ nguyên giao diện form nhưng mục đích đã thay đổi */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="ws-name" className="block text-sm text-gray-800 mb-1">Tên <span className="text-red-500">*</span></label>
                    <input type="text" id="ws-name" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus/>
                </div>

                <div>
                    <label htmlFor="ws-description" className="block text-sm text-gray-800 mb-1">Mô tả (tùy chọn)</label>
                    <textarea id="ws-description" value={description} onChange={e => setDescription(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                <div className="flex items-center gap-2">
                    <button type="submit" disabled={isSaving || !name.trim()} className="bg-blue-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSaving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md font-semibold">Hủy</button>
                </div>
            </form>
        </div>
    );
};

// --- Component cho nội dung của "Trello Không gian làm việc" ---
const DefaultWorkspaceContent = ({ onCreateClick, onEditClick }: { onCreateClick: () => void, onEditClick: () => void }) => {
    return (
        <div className="w-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-lg text-2xl font-bold">T</div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-gray-800">Trello Không gian làm việc</h1>
                        {/* Nút bút chì này giờ sẽ kích hoạt form TẠO MỚI */}
                        <button onClick={onEditClick} className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-md">
                            <LuPencil size={16} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        <LuLock size={12} className="inline-block mr-1" /> Riêng tư
                    </p>
                </div>
            </div>

            <h2 className="text-lg font-bold text-gray-700 mb-4">
                Các bảng của bạn
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="aspect-video bg-fuchsia-700 rounded-md p-3 text-white font-bold flex flex-col justify-between cursor-pointer hover:opacity-90">
                    Bảng Trello của tôi
                </div>
                <button onClick={onCreateClick} className="aspect-video bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 flex items-center justify-center">
                    Tạo bảng mới
                </button>
            </div>
        </div>
    )
}

// --- Component chính của trang ---
export default function DashboardPage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [user, setUser] = useState<User | null>(null); // Lưu trữ toàn bộ đối tượng user
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState<'dashboard' | 'create' | 'default_workspace_boards' | 'editing_default_workspace'>('dashboard');
    const [isDefaultWorkspaceOpen, setIsDefaultWorkspaceOpen] = useState(true);

    const supabase = createClient();

    // Tách logic fetch data ra một hàm để tái sử dụng
    const fetchWorkspaces = async () => {
        const { data, error } = await supabase
            .from('Workspaces')
            .select(`id, name, boards: Boards ( id, title )`);

        if (error) {
            console.error("Lỗi khi fetch workspaces:", error);
            setWorkspaces([]);
        } else {
            setWorkspaces(data || []);
        }
    };

    useEffect(() => {
        const initializePage = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return redirect('/login');
            }
            setUser(user); // Lưu lại đối tượng user

            await fetchWorkspaces();
            setLoading(false);
        };
        initializePage();
    }, [supabase]);

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center">Đang tải...</div>;
    }

    const handleCreateClick = () => setViewMode('create');
    const handleDashboardClick = () => setViewMode('dashboard');
    const handleDefaultWorkspaceBoardsClick = () => setViewMode('default_workspace_boards');
    const handleEditDefaultWorkspaceClick = () => setViewMode('editing_default_workspace');

    // Hàm callback khi tạo workspace thành công
    const handleWorkspaceCreationSuccess = () => {
        fetchWorkspaces(); // Tải lại danh sách workspaces
        setViewMode('default_workspace_boards'); // Quay về màn hình danh sách bảng
    }

    return (
        <div className="h-screen w-screen flex flex-col font-sans bg-gray-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm shadow-sm p-2 flex justify-between items-center shrink-0 z-10 border-b">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="p-2 rounded hover:bg-gray-200"><BsTrello className="text-2xl text-blue-600" /></Link>
                    <div className="hidden md:flex items-center gap-1">
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Các không gian làm việc <LuChevronDown className="inline-block ml-1" /></button>
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Gần đây <LuChevronDown className="inline-block ml-1" /></button>
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Đã đánh dấu sao <LuChevronDown className="inline-block ml-1" /></button>
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Mẫu <LuChevronDown className="inline-block ml-1" /></button>
                    </div>
                    <button onClick={handleCreateClick} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center gap-1">
                        Tạo mới <LuPlus className="hidden md:inline-block"/>
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <input type="search" placeholder="Tìm kiếm" className="px-3 py-1.5 border rounded-md text-sm hidden md:block" />
                    <div className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center rounded-full font-bold text-sm">
                        {user?.email?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <LogoutButton />
                </div>
            </header>

            <div className="flex flex-1 overflow-y-auto">
                {/* Sidebar trái */}
                <aside className="w-16 md:w-64 bg-white md:bg-gray-50 p-2 md:p-4 border-r border-gray-200 shrink-0 space-y-1 md:space-y-2">
                    <div className="hidden md:block">
                        <SidebarLink icon={LuLayoutDashboard} text="Bảng" onClick={() => alert('Chuyển đến trang tất cả Bảng')} />
                        <SidebarLink icon={LuLayoutDashboard} text="Mẫu" onClick={() => alert('Chuyển đến trang Mẫu')} />
                        <SidebarLink icon={LuLayoutDashboard} text="Trang chủ" active={viewMode === 'dashboard'} onClick={handleDashboardClick} />
                    </div>
                    <hr className="hidden md:block" />
                    <div className="hidden md:block">
                        <button onClick={() => setIsDefaultWorkspaceOpen(!isDefaultWorkspaceOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center rounded-md font-bold text-lg">T</div>
                                <span className="font-semibold text-sm text-gray-700">Trello Không gian làm việc</span>
                            </div>
                            <LuChevronDown className={`text-gray-500 transition-transform ${isDefaultWorkspaceOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDefaultWorkspaceOpen && (
                            <div className="mt-1 pl-6 space-y-1">
                                <SidebarLink icon={LuLayoutGrid} text="Bảng" active={viewMode === 'default_workspace_boards' || viewMode === 'editing_default_workspace'} onClick={handleDefaultWorkspaceBoardsClick} />
                                <SidebarLink icon={LuHeart} text="Điểm nổi bật" />
                                <SidebarLink icon={LuUser} text="Hình" />
                                <Link href="/workspace/1/members" className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left text-gray-700 hover:bg-gray-200">
                                    <LuUser className="text-lg" />
                                    <span>Thành viên</span>
                                </Link>
                                <SidebarLink icon={LuSettings} text="Cài đặt" onClick={handleEditDefaultWorkspaceClick}/>
                            </div>
                        )}
                    </div>
                    <hr className="hidden md:block" />

                    <div className="hidden md:flex justify-between items-center">
                        <h2 className="text-xs font-bold text-gray-500">CÁC KHÔNG GIAN LÀM VIỆC</h2>
                        <button onClick={() => setViewMode('editing_default_workspace')} className="p-1 hover:bg-gray-200 rounded"><LuPlus /></button>
                    </div>
                    {workspaces?.map(ws => (
                        <WorkspaceSidebarItem key={ws.id} workspace={ws} />
                    ))}
                </aside>

                {/* Nội dung chính */}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto flex">
                    {viewMode === 'create' ? (
                        <CreateBoardForm workspaces={workspaces} onClose={handleDashboardClick} />
                    ) : viewMode === 'editing_default_workspace' ? (
                        <EditWorkspaceForm
                            onCancel={handleDefaultWorkspaceBoardsClick}
                            onSuccess={handleWorkspaceCreationSuccess}
                            supabase={supabase}
                            user={user}
                        />
                    ) : viewMode === 'default_workspace_boards' ? (
                        <DefaultWorkspaceContent onCreateClick={handleCreateClick} onEditClick={handleEditDefaultWorkspaceClick} />
                    ) : (
                        <DashboardHomeContent onCreateClick={handleCreateClick} />
                    )}
                </main>
            </div>
        </div>
    );
}