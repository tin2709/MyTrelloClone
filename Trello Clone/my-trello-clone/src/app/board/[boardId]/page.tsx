'use client';

// --- SỬA LỖI 1: Xóa 'use' không được sử dụng ---
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { BoardSkeleton } from '@/components/BoardSkeleton';
import { importBoardData } from './import-actions';
import { ImportOptionsModal } from '@/components/ImportOptionsModal'; // Giả sử bạn đã tạo file này
// Server Actions
import {
    deleteList,
    restoreList,
    updateListOrder,
    getArchivedListsByBoard,
    getArchivedCardsByBoard
} from './list-actions';
import {restoreCard, deleteCard, updateCardOrder} from './card-actions';

// Types
import { ArchivedListItem, ArchivedCardItem } from '@/components/ArchivedItemsSidebar';
import dynamic from 'next/dynamic';
import type { BoardData, List, Card, Label, Workspace } from './types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'; // THÊM IMPORT NÀY
import { useParams } from 'next/navigation';
import { Tables } from '@/lib/type'; // Giả sử đường dẫn đúng

// Components
import { KanbanList } from './components/KanbanList';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { BoardHeader } from './components/BoardHeader';
import { AddListForm } from './components/AddListForm';
const BoardMenu = dynamic(() => import('@/components/BoardMenu'));
const ActivityFeed = dynamic(() => import('@/components/ActivityFeed'));
const ArchivedItemsSidebar = dynamic(() => import('@/components/ArchivedItemsSidebar'));
import { ToastNotification } from './components/ToastNotification';
import { LuPlus } from 'react-icons/lu';
import { toast as hotToast } from 'react-hot-toast'; // Import react-hot-toast

// Kiểu dữ liệu thô từ Supabase (giữ nguyên)
interface SupabaseRawCardLabel {
    Labels: Label | null;
}
interface SupabaseRawCard {
    id: string; title: string; position: number; list_id: string;
    description: string | null; completed_at: string | null;
    dued_at: string | null; started_at: string | null;
    archived_at: string | null; // SỬA LỖI: Thêm trường này
    Attachments: { count: number }[];
    Checklists: { id: string; Checklist_items: { id: string; is_completed: boolean; }[]; }[];
    Card_labels: SupabaseRawCardLabel[];
}
interface SupabaseRawList {
    id: string; title: string; position: number;
    cards: SupabaseRawCard[];
}
interface SupabaseRawBoard {
    id: string; title: string;
    workspace: Workspace | null;
    lists: SupabaseRawList[];
}
// Đặt các kiểu này ở đầu file, gần các định nghĩa kiểu khác
interface StructureCard {
    title: string;
}

interface StructureList {
    id: string;
    title: string;
    position: number;
    cards: StructureCard[];
}

interface StructureBoard {
    id: string;
    title: string;
    workspace: Workspace | null; // Giữ lại kiểu gốc
    lists: StructureList[];
}
export default function BoardPage() {

    const params = useParams<{ boardId: string }>();
    const { boardId } = params;
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
    const [background, setBackground] = useState<string>('');
    const [importJsonContent, setImportJsonContent] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const supabase = createClient();
    useEffect(() => {
        const savedBackground = localStorage.getItem(`board-background-${boardId}`);
        setBackground(savedBackground || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2070');
    }, [boardId]);

    useEffect(() => {
        if (background) {
            localStorage.setItem(`board-background-${boardId}`, background);
        }
    }, [background, boardId]);
    const fetchBoardData = useCallback(async () => {
        // SỬA LỖI: Thay đổi truy vấn để xử lý các bảng trống
        const { data, error } = await supabase
            .from('Boards')
            .select(`
                id, title, workspace:Workspaces(id, name),
                lists:Lists(
                    id, title, position,
                    cards:Cards(
                        id, title, position, list_id, description, completed_at, dued_at, started_at, archived_at,
                        Attachments(count),
                        Checklists(id, Checklist_items(id, is_completed)),
                        Card_labels(
                            Labels (id, name, color)
                        )
                    )
                )
            `)
            .eq('id', boardId)
            .is('lists.archived_at', null) // Chỉ lấy các danh sách chưa lưu trữ
            .single<SupabaseRawBoard>();

        if (error) {
            console.error("Lỗi khi fetch dữ liệu bảng:", error);
            setBoardData(null);
        } else if (data) {
            // Xử lý chuyển đổi từ kiểu thô sang kiểu chuẩn của ứng dụng
            const processedLists: List[] = (data.lists || []).map((list: SupabaseRawList): List => {
                const processedCards: Card[] = (list.cards || [])
                    .filter(card => !card.archived_at) // SỬA LỖI: Lọc các thẻ đã lưu trữ ở đây
                    .map((card: SupabaseRawCard): Card => {
                        const labels: Label[] = (card.Card_labels || [])
                            .map(cardLabel => cardLabel.Labels)
                            .filter((label): label is Label => label !== null);

                        const checklists = (card.Checklists || []).map(checklist => ({
                            id: checklist.id,
                            checklist_items: checklist.Checklist_items || []
                        }));

                        const newCard: Card = {
                            id: card.id,
                            title: card.title,
                            position: card.position,
                            list_id: card.list_id,
                            description: card.description,
                            completed_at: card.completed_at,
                            dued_at: card.dued_at,
                            started_at: card.started_at,
                            Attachments: card.Attachments,
                            Checklists: checklists,
                            labels: labels,
                        };

                        return newCard;
                    }).sort((a, b) => a.position - b.position);

                return { ...list, cards: processedCards };
            }).sort((a, b) => a.position - b.position);

            setBoardData({
                id: data.id,
                title: data.title,
                workspace: data.workspace,
                lists: processedLists,
            });
        }
        setLoading(false);
    }, [boardId, supabase]);

    // --- Các hàm và useEffect còn lại giữ nguyên ---

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

    const handleRestoreCard = useCallback(async (cardToRestore: ArchivedCardItem) => {
        const result = await restoreCard(cardToRestore.id, boardId, cardToRestore.title);
        if (result.success) {
            setToast({ message: `Đã khôi phục thẻ "${cardToRestore.title}".`, type: 'success' });
            await Promise.all([fetchBoardData(), fetchArchivedData()]);
        } else {
            setToast({ message: result.error || "Lỗi khi khôi phục thẻ.", type: 'error' });
        }
    }, [boardId, fetchBoardData, fetchArchivedData]);

    const handleDeleteCard = useCallback(async (cardToDelete: ArchivedCardItem) => {
        if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn thẻ "${cardToDelete.title}" không?`)) {
            return;
        }
        const result = await deleteCard(cardToDelete.id, boardId, cardToDelete.title);
        if (result.success) {
            setToast({ message: `Đã xóa vĩnh viễn thẻ "${cardToDelete.title}".`, type: 'success' });
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
    useEffect(() => {
        if (!boardId) {
            console.warn("[Board Realtime] useEffect: boardId is missing, subscription skipped.");
            return;
        }

        console.log(`[Board Realtime] Setting up subscription for board: ${boardId}`);

        const handleRealtimeChanges = (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
            console.groupCollapsed(`[Board Realtime] Payload Received: ${payload.eventType} on table "${payload.table}"`);
            console.log("Full Payload:", payload);
            console.groupEnd();

            const { eventType, table, new: newRecord, old: oldRecord } = payload;

            if (table === 'Lists') {
                const list = (eventType === 'DELETE' ? oldRecord : newRecord) as Tables<'Lists'>;
                if (list?.board_id === boardId) {
                    hotToast.dismiss();
                    if (eventType === 'INSERT') hotToast.success(`Danh sách "${list.title}" đã được thêm.`);
                    else if (eventType === 'UPDATE') {
                        const oldList = oldRecord as Tables<'Lists'>;
                        if (oldList && oldList.title !== list.title) hotToast(`Danh sách "${oldList.title}" đổi tên thành "${list.title}".`);
                        else if (list.archived_at && !oldList.archived_at) hotToast.error(`Danh sách "${list.title}" đã được lưu trữ.`);
                        else if (!list.archived_at && oldList.archived_at) hotToast.success(`Danh sách "${list.title}" đã được khôi phục.`);
                    } else if (eventType === 'DELETE') {
                        const oldList = oldRecord as Tables<'Lists'>;
                        hotToast.error(`Danh sách "${oldList.title}" đã được xóa.`);
                    }
                    fetchBoardData();
                }
            }

            if (table === 'Cards') {
                const card = (eventType === 'DELETE' ? oldRecord : newRecord) as Tables<'Cards'>;
                if (card?.board_id === boardId) {
                    hotToast.dismiss();
                    if (eventType === 'INSERT') hotToast.success(`Thẻ "${card.title}" đã được tạo.`);
                    else if (eventType === 'UPDATE') {
                        const oldCard = oldRecord as Tables<'Cards'>;
                        if (card.archived_at && !oldCard.archived_at) hotToast.error(`Thẻ "${card.title}" đã được lưu trữ.`);
                        else if (!card.archived_at && oldCard.archived_at) hotToast.success(`Thẻ "${card.title}" đã được khôi phục.`);
                        else if (oldCard.title !== card.title) hotToast(`Thẻ "${oldCard.title}" đổi tên thành "${card.title}".`);
                    } else if (eventType === 'DELETE') {
                        const oldCard = oldRecord as Tables<'Cards'>;
                        hotToast.error(`Thẻ "${oldCard.title}" đã được xóa.`);
                    }
                    fetchBoardData();
                }
            }
        };

        const channel = supabase
            .channel(`board-changes-${boardId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Lists' }, handleRealtimeChanges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Cards' }, handleRealtimeChanges)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') console.log(`%c[Board Realtime] Successfully subscribed to board ${boardId}`, "color: green;");
                if (status === 'CHANNEL_ERROR') console.error('[Board Realtime] Subscription error:', err);
                if (status === 'TIMED_OUT') console.warn(`%c[Board Realtime] Subscription timed out for board ${boardId}.`, "color: orange;");
            });

        return () => {
            console.log(`[Board Realtime] Unsubscribing from board ${boardId}`);
            supabase.removeChannel(channel);
        };

    }, [boardId, supabase, fetchBoardData])

    const handleExportJson = useCallback(() => {
        if (!boardData) {
            hotToast.error("Không có dữ liệu bảng để xuất.");
            return;
        }
        const jsonString = JSON.stringify(boardData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `board-${boardData.title.replace(/\s+/g, '-').toLowerCase()}-${boardData.id}.json`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        hotToast.success(`Đã xuất bảng "${boardData.title}" thành công!`);
    }, [boardData]);

    const handleExportStructure = useCallback(() => {
        if (!boardData) {
            hotToast.error("Không có dữ liệu bảng để xuất.");
            return;
        }

        // SỬA LỖI Ở ĐÂY
        // 1. Dùng `as` để báo cho TS biết kiểu dữ liệu sau khi parse
        const structureOnlyData = JSON.parse(JSON.stringify(boardData)) as StructureBoard;

        // 2. Lặp qua các danh sách
        structureOnlyData.lists.forEach((list) => { // Không cần `any`, TS đã biết `list` là `StructureList`

            // 3. `list.cards` ở đây là từ `boardData` gốc, nên kiểu của card là `Card`
            // TypeScript sẽ tự suy luận kiểu `card` là `Card` từ `boardData.lists`
            list.cards = boardData.lists
                .find(originalList => originalList.id === list.id)
                ?.cards.map((card) => ({ title: card.title })) || []; // Lấy card gốc và chỉ map ra title
        });

        // Gán workspace về null như logic ban đầu của bạn
        structureOnlyData.workspace = null;
        const jsonString = JSON.stringify(structureOnlyData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileName = `structure-with-titles-${boardData.title.replace(/\s+/g, '-').toLowerCase()}-${boardData.id}.json`;
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        hotToast.success(`Đã xuất cấu trúc bảng (kèm tiêu đề thẻ)!`);
    }, [boardData]);

    const listIds = useMemo(() => boardData?.lists.map(list => list.id) || [], [boardData]);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

    const handleOnDragEnd = useCallback((event: DragEndEvent) => {
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
            setBoardData(prev => {
                if (!prev) return prev;
                const newLists = [...prev.lists];
                const activeListIndex = newLists.findIndex(l => l.cards.some(c => c.id === activeId));
                if (activeListIndex === -1) return prev;
                const activeCardIndex = newLists[activeListIndex].cards.findIndex(c => c.id === activeId);
                const [activeCard] = newLists[activeListIndex].cards.splice(activeCardIndex, 1);
                const overIsAList = over.data.current?.type === 'List';
                let overListIndex, overCardIndex;
                if (overIsAList) {
                    overListIndex = newLists.findIndex(l => l.id === overId);
                    overCardIndex = newLists[overListIndex].cards.length;
                } else {
                    overListIndex = newLists.findIndex(l => l.cards.some(c => c.id === overId));
                    if (overListIndex === -1) return prev;
                    overCardIndex = newLists[overListIndex].cards.findIndex(c => c.id === overId);
                }
                newLists[overListIndex].cards.splice(overCardIndex, 0, activeCard);
                const updatePromises: Promise<void>[] = [];
                const sourceList = newLists[activeListIndex];
                const destList = newLists[overListIndex];
                destList.cards.forEach((card, index) => {
                    const promise = updateCardOrder(card.id, destList.id, index, boardId);
                    updatePromises.push(promise);
                });
                if (activeListIndex !== overListIndex) {
                    sourceList.cards.forEach((card, index) => {
                        const promise = updateCardOrder(card.id, sourceList.id, index, boardId);
                        updatePromises.push(promise);
                    });
                }
                Promise.all(updatePromises).catch(err => {
                    console.error("Lỗi khi đồng bộ thứ tự thẻ với server:", err);
                });
                return { ...prev, lists: newLists };
            });
        }
    }, [boardData, boardId]);
    const mainStyle = useMemo(() => ({
        transition: 'background 0.5s ease-in-out',
        ...(background.startsWith('http') || background.startsWith('/')
            ? { backgroundImage: `url('${background}')` }
            : { backgroundColor: background })
    }), [background]);
    const handleInitiateImport = (jsonContent: string) => {
        try {
            // Kiểm tra nhanh xem có phải là JSON hợp lệ không
            JSON.parse(jsonContent);
            setImportJsonContent(jsonContent); // Lưu nội dung lại, việc này sẽ kích hoạt hiển thị Modal
        } catch {
            hotToast.error("Tệp không phải là một file JSON hợp lệ.");
            setImportJsonContent(null);
        }
    };

    // HÀM MỚI: Được gọi từ Modal khi người dùng xác nhận lựa chọn
    const handleConfirmImport = async (mode: 'merge' | 'replace') => {
        if (!importJsonContent || !boardId) return;

        setIsImporting(true);
        hotToast.loading('Đang nhập dữ liệu...', { id: 'import-toast' });

        const result = await importBoardData(boardId, importJsonContent, mode);

        hotToast.dismiss('import-toast');

        if (result.success) {
            hotToast.success(result.message || 'Nhập dữ liệu thành công!');
            // QUAN TRỌNG: Tải lại dữ liệu bảng sau khi nhập thành công
            await fetchBoardData();
        } else {
            hotToast.error(result.error || 'Đã xảy ra lỗi khi nhập.');
        }

        // Reset state để đóng modal và cho phép thực hiện lại
        setIsImporting(false);
        setImportJsonContent(null);
    };
    if (loading) return <BoardSkeleton />;
    if (!boardData) return <div className="h-screen w-screen flex items-center justify-center bg-gray-800 text-white">Không tìm thấy bảng.</div>;

    const { title, workspace, lists } = boardData;

    return (
        <div className="h-screen w-screen flex flex-col font-sans">
            {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {importJsonContent && (
                <ImportOptionsModal
                    onCancel={() => {
                        setImportJsonContent(null);
                        setIsImporting(false);
                    }}
                    onConfirm={handleConfirmImport}
                    isImporting={isImporting}
                />
            )}
            {isBoardMenuOpen && (
                <BoardMenu
                    onClose={() => setIsBoardMenuOpen(false)}
                    onShowActivity={() => { setIsBoardMenuOpen(false); setIsActivityFeedOpen(true); }}
                    onShowArchive={() => { setIsBoardMenuOpen(false); setIsArchiveSidebarOpen(true); }}
                    onBackgroundChange={setBackground}
                    onExportJson={handleExportJson}
                    onExportStructure={handleExportStructure}
                    onImportJson={handleInitiateImport} // <--- TRUYỀN HÀM XỬ LÝ VÀO ĐÂY

                />
            )}
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
                    onRestoreCard={handleRestoreCard}
                    onDeleteCard={handleDeleteCard}
                />
            )}
            <header className="bg-purple-800/80 ...">{/* Header chính */}</header>
            <div className="flex flex-1 overflow-hidden">
                <WorkspaceSidebar workspaceName={workspace?.name || 'Workspace'} activeBoardName={title} />
                <main className="flex-1 flex flex-col bg-cover bg-center min-w-0" style={mainStyle}>
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