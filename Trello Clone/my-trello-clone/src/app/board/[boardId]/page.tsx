'use client';

// Thêm `use` vào import
import React, { useState, useEffect, useCallback, useMemo, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { BoardSkeleton } from '@/components/BoardSkeleton'; // Import component mới

// Server Actions
import {
    deleteList,
    restoreList,
    updateListOrder,
    getArchivedListsByBoard,
    getArchivedCardsByBoard
} from './list-actions';
// Xóa import cho restoreCard và deleteCard vì chưa dùng đến
// import { logCardMove } from './card-actions';
 import { restoreCard,deleteCard } from './card-actions';

// Types
// interface Card { id: string; title: string; position: number; list_id: string; }
// interface List { id: string; title: string; position: number; cards: Card[]; }
interface Workspace { id: string; name: string; }
interface BoardData { id: string; title: string; workspace: Workspace | null; lists: List[]; }
import { ArchivedListItem, ArchivedCardItem } from '@/components/ArchivedItemsSidebar';
import dynamic from 'next/dynamic';

// Components
import { KanbanList, type List } from './components/KanbanList'; // <-- Import các kiểu từ KanbanList

import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { BoardHeader } from './components/BoardHeader';
import { AddListForm } from './components/AddListForm';
const BoardMenu = dynamic(() => import('@/components/BoardMenu'));
const ActivityFeed = dynamic(() => import('@/components/ActivityFeed'));
const ArchivedItemsSidebar = dynamic(() => import('@/components/ArchivedItemsSidebar'));
import { ToastNotification } from './components/ToastNotification';
import { LuPlus } from 'react-icons/lu';

// Đổi kiểu props của component
interface BoardPageProps {
    params: Promise<{ boardId: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
    // Dùng `use(params)` để lấy `boardId`
    const { boardId } = use(params);

    const [boardData, setBoardData] = useState<BoardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddingList, setIsAddingList] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
    const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
    const [isArchiveSidebarOpen, setIsArchiveSidebarOpen] = useState(false);

    const [archivedLists, setArchivedLists] = useState<ArchivedListItem[]>([]);
    const [archivedCards, setArchivedCards] = useState<ArchivedCardItem[]>([]);
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveTab, setArchiveTab] = useState<'cards' | 'lists'>('cards');
    const [archiveSearch, setArchiveSearch] = useState('');

    const supabase = createClient();

    const fetchBoardData = useCallback(async () => {
        // ... (Logic không đổi)
        const query = supabase
            .from('Boards')
            .select(`id, title, workspace:Workspaces(id, name), lists:Lists!inner(id, title, position, cards:Cards(id, title, position, list_id))`)
            .eq('id', boardId)
            .is('lists.archived_at', null)
            .is('lists.cards.archived_at', null)
            .single();
        const { data, error } = await query;
        if (error) {
            console.error("Lỗi khi fetch dữ liệu bảng:", error);
            setBoardData(null);
        } else if (data) {
            const sortedData = {
                ...data,
                lists: data.lists.sort((a, b) => a.position - b.position).map(list => ({ ...list, cards: list.cards.sort((a, b) => a.position - b.position) }))
            };
            setBoardData(sortedData as BoardData);
        }
        setLoading(false);
    }, [boardId, supabase]);

    const fetchArchivedData = useCallback(async () => {
        if (!isArchiveSidebarOpen) return;
        setArchiveLoading(true);
        try {
            const [listsData, cardsData] = await Promise.all([
                getArchivedListsByBoard(boardId),
                getArchivedCardsByBoard(boardId)
            ]);
            setArchivedLists(listsData || []);
            setArchivedCards(cardsData || []);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu lưu trữ:", error);
            setToast({ message: "Không thể tải dữ liệu đã lưu trữ.", type: 'error' });
        } finally {
            setArchiveLoading(false);
        }
    }, [boardId, isArchiveSidebarOpen]);

    useEffect(() => {
        setLoading(true);
        fetchBoardData();
    }, [fetchBoardData]);

    useEffect(() => {
        fetchArchivedData();
    }, [isArchiveSidebarOpen, fetchArchivedData]);

    const handleRestoreList = useCallback(async (listId: string) => {
        // ... (Logic không đổi)
        const listToRestore = archivedLists.find(l => l.id === listId);
        if (!listToRestore) return;
        const formData = new FormData();
        formData.append('id', listId);
        formData.append('boardId', boardId);
        formData.append('title', listToRestore.title);
        const result = await restoreList({}, formData);
        if (result.success) {
            setToast({ message: `Đã khôi phục danh sách "${listToRestore.title}".`, type: 'success' });
            await Promise.all([fetchBoardData(), fetchArchivedData()]);
        } else {
            setToast({ message: result.error || "Lỗi khôi phục.", type: 'error' });
        }
    }, [archivedLists, boardId, fetchBoardData, fetchArchivedData]);

    const handleDeleteList = useCallback(async (listId: string) => {
        // ... (Logic không đổi)
        if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn danh sách này không?")) return;
        const listToDelete = archivedLists.find(l => l.id === listId);
        if (!listToDelete) return;
        const formData = new FormData();
        formData.append('id', listId);
        formData.append('boardId', boardId);
        formData.append('title', listToDelete.title);
        const result = await deleteList({}, formData);
        if (result.success) {
            setToast({ message: `Đã xóa vĩnh viễn danh sách "${listToDelete.title}".`, type: 'success' });
            await fetchArchivedData();
        } else {
            setToast({ message: result.error || "Không thể xóa danh sách.", type: 'error' });
        }
    }, [archivedLists, boardId, fetchArchivedData]);


    // --- YÊU CẦU: Để trống các hàm này ---
    const handleRestoreCard = useCallback(async (cardToRestore: ArchivedCardItem) => {
        // Gọi server action với đầy đủ thông tin
        const result = await restoreCard(cardToRestore.id, boardId, cardToRestore.title);

        if (result.success) {
            // Hiển thị thông báo thành công với tên thẻ
            setToast({ message: `Đã khôi phục thẻ "${cardToRestore.title}".`, type: 'success' });
            // Tải lại dữ liệu cho cả bảng và kho lưu trữ
            await Promise.all([fetchBoardData(), fetchArchivedData()]);
        } else {
            setToast({ message: result.error || "Lỗi khi khôi phục thẻ.", type: 'error' });
        }
    }, [boardId, fetchBoardData, fetchArchivedData]);

    const handleDeleteCard = useCallback(async (cardToDelete: ArchivedCardItem) => {
        // Hỏi xác nhận trước khi xóa
        if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn thẻ "${cardToDelete.title}" không?`)) {
            return;
        }

        const result = await deleteCard(cardToDelete.id, boardId, cardToDelete.title);

        if (result.success) {
            // Hiển thị thông báo thành công với tên thẻ
            setToast({ message: `Đã xóa vĩnh viễn thẻ "${cardToDelete.title}".`, type: 'success' });
            // Chỉ cần tải lại dữ liệu của kho lưu trữ
            await fetchArchivedData();
        } else {
            setToast({ message: result.error || "Lỗi khi xóa thẻ.", type: 'error' });
        }
    }, [boardId, fetchArchivedData]);
    const filteredArchivedLists = useMemo(() => {
        return archivedLists.filter(list => list.title.toLowerCase().includes(archiveSearch.toLowerCase()));
    }, [archivedLists, archiveSearch]);

    const filteredArchivedCards = useMemo(() => {
        return archivedCards.filter(card => card.title.toLowerCase().includes(archiveSearch.toLowerCase()));
    }, [archivedCards, archiveSearch]);

    const listIds = useMemo(() => boardData?.lists.map(list => list.id) || [], [boardData]);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

    const handleOnDragEnd = useCallback((event: DragEndEvent) => {
        // ... (Logic không đổi)
        const { active, over } = event;
        if (!over || !boardData) return;
        const activeId = active.id;
        const overId = over.id;
        if (activeId === overId) return;

        const isActiveAList = active.data.current?.type === 'List';
        if (isActiveAList) {
            setBoardData(prev => {
                if (!prev) return null;
                const oldIndex = prev.lists.findIndex(l => l.id === activeId);
                const newIndex = prev.lists.findIndex(l => l.id === overId);
                const reorderedLists = arrayMove(prev.lists, oldIndex, newIndex);
                updateListOrder(reorderedLists.map((list, index) => ({ id: list.id, position: index })), boardId);
                return { ...prev, lists: reorderedLists };
            });
            return;
        }

        const isActiveACard = active.data.current?.type === 'Card';
        if (isActiveACard) {
            // ... (Phần logic kéo thả thẻ phức tạp không đổi)
        }
    }, [boardData, boardId]);
    if (loading) return <BoardSkeleton />;

    // if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-800 text-white">Đang tải bảng...</div>;
    if (!boardData) return <div className="h-screen w-screen flex items-center justify-center bg-gray-800 text-white">Không tìm thấy bảng.</div>;

    const { title, workspace, lists } = boardData;

    return (
        <div className="h-screen w-screen flex flex-col font-sans">
            {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {isBoardMenuOpen && <BoardMenu onClose={() => setIsBoardMenuOpen(false)} onShowActivity={() => { setIsBoardMenuOpen(false); setIsActivityFeedOpen(true); }}
                                           onShowArchive={() => { setIsBoardMenuOpen(false); setIsArchiveSidebarOpen(true); }}
            />}
            {isActivityFeedOpen && <ActivityFeed boardId={boardId} onClose={() => setIsActivityFeedOpen(false)} />}
            {isArchiveSidebarOpen && (
                <ArchivedItemsSidebar
                    activeTab={archiveTab}
                    searchTerm={archiveSearch}
                    isLoading={archiveLoading}
                    archivedLists={filteredArchivedLists}
                    archivedCards={filteredArchivedCards}
                    onClose={() => setIsArchiveSidebarOpen(false)}
                    onBack={() => { setIsArchiveSidebarOpen(false); setIsBoardMenuOpen(true); }}
                    onTabChange={setArchiveTab}
                    onSearchChange={setArchiveSearch}
                    onRestoreList={handleRestoreList}
                    onDeleteList={handleDeleteList}
                    // YÊU CẦU: Truyền các hàm trống vào props
                    onRestoreCard={handleRestoreCard}
                    onDeleteCard={handleDeleteCard}
                />
            )}
            <header className="bg-purple-800/80 ...">{/* Header chính */}</header>
            <div className="flex flex-1 overflow-hidden">
                <WorkspaceSidebar workspaceName={workspace?.name || 'Workspace'} activeBoardName={title} />
                <main className="flex-1 flex flex-col bg-cover bg-center min-w-0" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2070')` }}>
                    <BoardHeader boardName={title} onMenuClick={() => setIsBoardMenuOpen(true)} />
                    <div className="flex-1 overflow-x-auto p-4">
                        <DndContext sensors={sensors} onDragEnd={handleOnDragEnd}>
                            <div className="flex gap-4 h-full items-start">
                                <SortableContext items={listIds}>
                                    {lists.map(list => (
                                        <KanbanList
                                            key={list.id}
                                            list={list}
                                            boardId={boardId}
                                            allLists={lists}
                                            onCardCreated={fetchBoardData}
                                            onListUpdated={fetchBoardData}
                                            onShowToast={(message) => setToast({ message, type: 'success' })}
                                        />
                                    ))}
                                </SortableContext>
                                <div>
                                    {!isAddingList ? (
                                        <button onClick={() => setIsAddingList(true)} className="w-72 p-2.5 rounded-lg bg-white/30 hover:bg-white/40 text-white font-semibold text-left shrink-0">
                                            <LuPlus className="inline-block mr-2" /> Thêm danh sách khác
                                        </button>
                                    ) : (
                                        <AddListForm boardId={boardId} onCancel={() => setIsAddingList(false)} onListCreated={() => { fetchBoardData(); setIsAddingList(false); }} />
                                    )}
                                </div>
                            </div>
                        </DndContext>
                    </div>
                </main>
            </div>
        </div>
    );
}