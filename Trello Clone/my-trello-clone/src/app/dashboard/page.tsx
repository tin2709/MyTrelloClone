// src/app/dashboard/page.tsx (PHIÊN BẢN SỬA LỖI HOÀN CHỈNH)
'use client';

import React, {useState, useEffect} from 'react';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createBoard } from './board-actions';

// --- Icons ---
import { BsTrello } from 'react-icons/bs';
import {
    LuPlus, LuLayoutDashboard, LuChevronDown, LuX, LuLock,
    LuLayoutGrid, LuHeart, LuUser, LuSettings, LuPencil,LuLoader
} from 'react-icons/lu';
import LogoutButton from '@/components/LogoutButton';
import {useFormState, useFormStatus} from "react-dom";

// --- Định nghĩa Types ---
interface Board {
    id: string;
    title: string;
    background?: string | null;
}
interface Workspace {
    id: string;
    name: string;
    description: string | null;
    boards: Board[];
}

// --- Component phụ: Mục trên Sidebar ---
const SidebarLink = ({ icon: Icon, text, active = false, onClick }: { icon: React.ElementType, text: string, active?: boolean, onClick?: () => void }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left ${active ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-200'}`}>
        <Icon className="text-lg" />
        <span>{text}</span>
    </button>
);

// --- Component phụ: Mục Workspace trên Sidebar ---
const WorkspaceSidebarItem = ({ workspace, onClick }: { workspace: Workspace, onClick: () => void }) => {
    const initial = workspace.name?.charAt(0).toUpperCase() || 'W';
    const colors = ['bg-green-600', 'bg-red-500', 'bg-purple-600', 'bg-blue-500', 'bg-orange-500'];
    const bgColor = colors[initial.charCodeAt(0) % colors.length];

    return (
        <button onClick={onClick} className="w-full text-left">
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-200 cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 ${bgColor} text-white flex items-center justify-center rounded-md font-bold text-sm`}>{initial}</div>
                    <span className="font-semibold text-sm text-gray-700">{workspace.name}</span>
                </div>
            </div>
        </button>
    );
};

// --- Component phụ: Form tạo bảng ---
const CreateBoardForm = ({ workspaces, onClose }: { workspaces: Workspace[], onClose: () => void }) => {
    const backgroundImages = [ "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop", "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop", "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop" ];
    const backgroundColors = ["#E2E8F0", "#3B82F6", "#1E40AF", "#6D28D9", "#BE185D", "#047857"];
    const [selectedBg, setSelectedBg] = useState({ type: 'image', value: backgroundImages[0] });

    const initialState = { success: false, error: null, errors: {} };
    const [state, formAction] = useFormState(createBoard, initialState);

    const SubmitButton = () => {
        const { pending } = useFormStatus();
        return ( <button type="submit" disabled={pending} className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"> {pending ? (<><LuLoader className="animate-spin" />Đang tạo...</>) : 'Tạo mới'} </button> );
    };

    useEffect(() => {
        if (state.success) {
            onClose();
        }
    }, [state.success, onClose]);

    return (
        <div className="relative w-full max-w-lg mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-4 md:p-6">
                <div className="flex justify-between items-center mb-4"> <h2 className="text-lg font-bold text-gray-700">Tạo bảng</h2> <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"> <LuX className="text-gray-500" /> </button> </div>
                <div className="h-32 w-full bg-cover bg-center rounded-md mb-4 flex items-center justify-center" style={{ backgroundImage: `url(${selectedBg.type === 'image' ? selectedBg.value : ''})`, backgroundColor: selectedBg.type === 'color' ? selectedBg.value : 'transparent' }}> <Image src="/images/board-preview.svg" alt="Board Preview" width={100} height={60} /> </div>
                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="background" value={`${selectedBg.type}:${selectedBg.value}`} />
                    <div>
                        <label htmlFor="board-title" className="block text-xs font-bold text-gray-600 mb-1">Tiêu đề bảng <span className="text-red-500">*</span></label>
                        {/* SỬA LỖI: Truy cập state.errors.title thay vì state.error.title */}
                        <input type="text" id="board-title" name="title" required className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${state?.errors?.title ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`} autoFocus />
                        {state?.errors?.title && <p className="text-red-500 text-xs mt-1">{state.errors.title}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Nền</label>
                        <div className="grid grid-cols-4 gap-2 mb-2"> {backgroundImages.map(img => ( <button key={img} type="button" onClick={() => setSelectedBg({ type: 'image', value: img })} className={`aspect-video w-full bg-cover bg-center rounded ${selectedBg.value === img ? 'ring-2 ring-blue-500' : ''}`} style={{ backgroundImage: `url(${img})` }} /> ))} </div>
                        <div className="grid grid-cols-6 gap-2"> {backgroundColors.map(color => ( <button key={color} type="button" onClick={() => setSelectedBg({ type: 'color', value: color })} className={`aspect-square w-full rounded ${selectedBg.value === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`} style={{ backgroundColor: color }} /> ))} </div>
                    </div>
                    <div>
                        <label htmlFor="workspace-select" className="block text-xs font-bold text-gray-600 mb-1">Không gian làm việc <span className="text-red-500">*</span></label>
                        {/* SỬA LỖI: Truy cập state.errors.workspaceId thay vì state.error.workspaceId */}
                        <select id="workspace-select" name="workspaceId" required className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 ${state?.errors?.workspaceId ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`}>
                            <option value="">-- Chọn không gian làm việc --</option>
                            {workspaces.map(ws => ( <option key={ws.id} value={ws.id}>{ws.name}</option> ))}
                        </select>
                        {state?.errors?.workspaceId && <p className="text-red-500 text-xs mt-1">{state.errors.workspaceId}</p>}
                    </div>
                    <SubmitButton />
                    {state.error && !state.errors && <p className="text-red-500 text-sm mt-2 text-center">{state.error}</p>}
                </form>
            </div>
        </div>
    );
};

// --- Component phụ: Nội dung chính khi không ở chế độ tạo ---
const DashboardHomeContent = ({ onCreateClick }: { onCreateClick: () => void }) => (
    <div className="flex-1 flex justify-center items-start pt-16">
        <div className="text-center max-w-lg p-8 border border-gray-200 rounded-lg bg-white shadow-sm">
            <Image src="/images/husky.svg" alt="Trello Husky" width={180} height={180} className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Theo dõi và cập nhật</h2>
            <p className="text-gray-600 mb-6">Mời mọi người vào bảng và thẻ, để lại nhận xét, thêm ngày hết hạn và chúng tôi sẽ hiển thị hoạt động quan trọng nhất ở đây.</p>
            <button onClick={onCreateClick} className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700">Tạo Bảng đầu tiên của bạn</button>
        </div>
    </div>
);

// --- Component phụ: Form tạo/sửa Workspace ---
interface WorkspaceFormProps { onCancel: () => void; onSuccess: () => void; supabase: SupabaseClient; user: User | null; }
const WorkspaceForm = ({ onCancel, onSuccess, supabase, user }: WorkspaceFormProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return alert('Tên không gian làm việc không được để trống.');
        setIsSaving(true);
        try {
            const { data: workspaceData, error: workspaceError } = await supabase.from('Workspaces').insert({ name: name.trim(), description: description.trim(), user_id: user.id }).select().single();
            if (workspaceError) throw workspaceError;
            const { error: memberError } = await supabase.from('Workspace_members').insert({ workspace_id: workspaceData.id, user_id: user.id, role: 'admin' });
            if (memberError) throw memberError;
            alert('Tạo không gian làm việc thành công!');
            onSuccess();
        } catch (error) {
            console.error('Lỗi khi tạo không gian làm việc:', error);
            let errorMessage = 'Đã xảy ra lỗi không mong muốn.';
            if (error instanceof Error) errorMessage = error.message;
            alert(`Đã xảy ra lỗi: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };
    return (
        <div className="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div> <label htmlFor="ws-name" className="block text-sm text-gray-800 mb-1">Tên <span className="text-red-500">*</span></label> <input type="text" id="ws-name" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus/> </div>
                <div> <label htmlFor="ws-description" className="block text-sm text-gray-800 mb-1">Mô tả (tùy chọn)</label> <textarea id="ws-description" value={description} onChange={e => setDescription(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea> </div>
                <div className="flex items-center gap-2"> <button type="submit" disabled={isSaving || !name.trim()} className="bg-blue-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"> {isSaving ? 'Đang lưu...' : 'Lưu'} </button> <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md font-semibold">Hủy</button> </div>
            </form>
        </div>
    );
};

// --- Component cho nội dung của "Trello Không gian làm việc" mặc định ---
const DefaultWorkspaceContent = ({ onCreateClick, onEditClick }: { onCreateClick: () => void, onEditClick: () => void }) => (
    <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-lg text-2xl font-bold">T</div>
            <div>
                <div className="flex items-center gap-2"> <h1 className="text-xl font-bold text-gray-800">Trello Không gian làm việc</h1> <button onClick={onEditClick} className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-md"> <LuPencil size={16} /> </button> </div>
                <p className="text-sm text-gray-500"> <LuLock size={12} className="inline-block mr-1" /> Riêng tư </p>
            </div>
        </div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">Các bảng của bạn</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Link href="/board/1"><div className="aspect-video bg-fuchsia-700 rounded-md p-3 text-white font-bold flex flex-col justify-between cursor-pointer hover:opacity-90">Bảng Trello của tôi</div></Link>
            <button onClick={onCreateClick} className="aspect-video bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 flex items-center justify-center">Tạo bảng mới</button>
        </div>
    </div>
);

// --- Component cho nội dung của Workspace cụ thể ---
const SpecificWorkspaceContent = ({ workspace, onCreateClick, onEditClick }: { workspace: Workspace, onCreateClick: () => void, onEditClick: () => void }) => {
    const initial = workspace.name?.charAt(0).toUpperCase() || 'W';
    const colors = ['bg-green-600', 'bg-red-500', 'bg-purple-600', 'bg-blue-500', 'bg-orange-500'];
    const bgColor = colors[initial.charCodeAt(0) % colors.length];

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 ${bgColor} text-white flex items-center justify-center rounded-lg text-2xl font-bold`}>{initial}</div>
                <div>
                    <div className="flex items-center gap-2"> <h1 className="text-xl font-bold text-gray-800">{workspace.name}</h1> <button onClick={onEditClick} className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-md"> <LuPencil size={16} /> </button> </div>
                    {workspace.description && <p className="text-sm text-gray-600">{workspace.description}</p>}
                </div>
            </div>
            <h2 className="text-lg font-bold text-gray-700 mb-4">Các bảng của bạn</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {workspace.boards.map(board => (
                    <Link href={`/board/${board.id}`} key={board.id}>
                        <div className="aspect-video bg-fuchsia-700 rounded-md p-3 text-white font-bold flex flex-col justify-between cursor-pointer hover:opacity-90">{board.title}</div>
                    </Link>
                ))}
                <button onClick={onCreateClick} className="aspect-video bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 flex items-center justify-center">Tạo bảng mới</button>
            </div>
        </div>
    );
};

// --- Component chính của trang ---
export default function DashboardPage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // SỬA LỖI: Chuẩn hóa tên viewMode
    const [viewMode, setViewMode] = useState<'dashboard' | 'creating_board' | 'default_workspace_boards' | 'creating_workspace' | 'specific_workspace_boards'>('dashboard');
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [isDefaultWorkspaceOpen, setIsDefaultWorkspaceOpen] = useState(true);
    const supabase = createClient();

    const fetchWorkspaces = async () => {
        // SỬA LỖI: Xóa 'background' khỏi truy vấn vì nó không tồn tại trong schema
        const { data, error } = await supabase.from('Workspaces').select(`id, name, description, boards: Boards ( id, title )`);
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
            if (!user) return redirect('/login');
            setUser(user);
            await fetchWorkspaces();
            setLoading(false);
        };
        initializePage();
    }, [supabase]);

    const handleCreateBoardClick = () => setViewMode('creating_board');
    const handleDashboardClick = () => {
        setSelectedWorkspace(null); // Reset khi quay về trang chủ
        setViewMode('dashboard');
    };
    const handleDefaultWorkspaceBoardsClick = () => {
        setSelectedWorkspace(null);
        setViewMode('default_workspace_boards');
    };
    // SỬA LỖI: Đổi tên hàm cho rõ ràng
    const handleCreateNewWorkspaceClick = () => setViewMode('creating_workspace');
    const handleWorkspaceSelect = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        setViewMode('specific_workspace_boards');
    };
    const handleWorkspaceCreationSuccess = () => {
        fetchWorkspaces();
        setViewMode('dashboard');
    };

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center">Đang tải...</div>;
    }

    return (
        <div className="h-screen w-screen flex flex-col font-sans bg-gray-50">
            <header className="bg-white/80 backdrop-blur-sm p-2 flex justify-between items-center shrink-0 z-10 border-b">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="p-2 rounded hover:bg-gray-200"><BsTrello className="text-2xl text-blue-600" /></Link>
                    <div className="hidden md:flex items-center gap-1">
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Các không gian làm việc <LuChevronDown className="inline-block ml-1" /></button>
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Gần đây <LuChevronDown className="inline-block ml-1" /></button>
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Đã đánh dấu sao <LuChevronDown className="inline-block ml-1" /></button>
                        <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 rounded hover:bg-gray-200">Mẫu <LuChevronDown className="inline-block ml-1" /></button>
                    </div>
                    <button onClick={handleCreateBoardClick} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center gap-1">
                        Tạo mới <LuPlus className="hidden md:inline-block"/>
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <input type="search" placeholder="Tìm kiếm" className="px-3 py-1.5 border rounded-md text-sm hidden md:block" />
                    <div className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center rounded-full font-bold text-sm">{user?.email?.charAt(0).toUpperCase() || 'T'}</div>
                    <LogoutButton />
                </div>
            </header>

            <div className="flex flex-1 overflow-y-auto">
                <aside className="w-16 md:w-64 bg-white md:bg-gray-50 p-2 md:p-4 border-r border-gray-200 shrink-0 space-y-1 md:space-y-2">
                    <div className="hidden md:block">
                        <SidebarLink icon={LuLayoutDashboard} text="Bảng" onClick={handleDefaultWorkspaceBoardsClick} />
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
                                <SidebarLink icon={LuLayoutGrid} text="Bảng" active={viewMode === 'default_workspace_boards'} onClick={handleDefaultWorkspaceBoardsClick} />
                                <SidebarLink icon={LuHeart} text="Điểm nổi bật" />
                                <Link href="/workspace/1/members" className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left text-gray-700 hover:bg-gray-200"><LuUser className="text-lg" /><span>Thành viên</span></Link>
                                <SidebarLink icon={LuSettings} text="Cài đặt" onClick={handleCreateNewWorkspaceClick}/>
                            </div>
                        )}
                    </div>
                    <hr className="hidden md:block" />
                    <div className="hidden md:flex justify-between items-center">
                        <h2 className="text-xs font-bold text-gray-500">CÁC KHÔNG GIAN LÀM VIỆC</h2>
                        <button onClick={handleCreateNewWorkspaceClick} className="p-1 hover:bg-gray-200 rounded"><LuPlus /></button>
                    </div>
                    {workspaces?.map(ws => (
                        <WorkspaceSidebarItem key={ws.id} workspace={ws} onClick={() => handleWorkspaceSelect(ws)} />
                    ))}
                </aside>

                <main className="flex-1 p-4 md:p-6 overflow-y-auto flex">
                    {viewMode === 'creating_board' ? (
                        <CreateBoardForm workspaces={workspaces} onClose={handleDashboardClick} />
                    ) : viewMode === 'creating_workspace' ? (
                        <WorkspaceForm
                            onCancel={handleDashboardClick}
                            onSuccess={handleWorkspaceCreationSuccess}
                            supabase={supabase}
                            user={user}
                        />
                    ) : viewMode === 'specific_workspace_boards' && selectedWorkspace ? (
                        <SpecificWorkspaceContent
                            workspace={selectedWorkspace}
                            onCreateClick={handleCreateBoardClick}
                            onEditClick={handleCreateNewWorkspaceClick}
                        />
                    ) : viewMode === 'default_workspace_boards' ? (
                        <DefaultWorkspaceContent onCreateClick={handleCreateBoardClick} onEditClick={handleCreateNewWorkspaceClick} />
                    ) : (
                        <DashboardHomeContent onCreateClick={handleCreateBoardClick} />
                    )}
                </main>
            </div>
        </div>
    );
}