'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { updateListOrder } from './list-actions';
import { logCardMove } from './card-actions';

// Import các types cần thiết (nên tạo file types.ts riêng)
interface Card { id: string; title: string; position: number; list_id: string; }
interface List { id: string; title: string; position: number; cards: Card[]; }
interface Workspace { id: string; name: string; }
interface BoardData { id: string; title: string; workspace: Workspace | null; lists: List[]; }

// Import các component đã tách
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { BoardHeader } from './components/BoardHeader';
import { KanbanList } from './components/KanbanList';
import { AddListForm } from './components/AddListForm';
import BoardMenu from '@/components/BoardMenu';
import ActivityFeed from '@/components/ActivityFeed';
import {ToastNotification}  from './components/ToastNotification';

import { LuPlus } from 'react-icons/lu';

export default function BoardPage({ params }: { params: { boardId: string } }) {
    const [boardData, setBoardData] = useState<BoardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddingList, setIsAddingList] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
    const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);

    const supabase = createClient();

    const fetchBoardData = useCallback(async () => {
        const { data, error } = await supabase.from('Boards').select(`id, title, workspace:Workspaces(id, name), lists:Lists(id, title, position, cards:Cards(id, title, position, list_id))`).eq('id', params.boardId).single();
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
    }, [params.boardId, supabase]);

    useEffect(() => {
        setLoading(true);
        fetchBoardData();
    }, [fetchBoardData]);

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
                updateListOrder(reorderedLists.map((list, index) => ({ id: list.id, position: index })), params.boardId);
                return { ...prev, lists: reorderedLists };
            });
            return;
        }

        const isActiveACard = active.data.current?.type === 'Card';
        if (isActiveACard) {
            let originalLists: List[] = [];
            setBoardData(prev => {
                if (!prev) return prev;
                originalLists = JSON.parse(JSON.stringify(prev.lists));
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
                // Logic cập nhật server...
                return { ...prev, lists: newLists };
            });

            // Logic ghi log...
            const sourceList = originalLists.find(l => l.cards.some(c => c.id === activeId));
            const destList = boardData.lists.find(l => l.cards.some(c => c.id === activeId));
            const activeCard = active.data.current?.card as Card;
            if (sourceList && destList && activeCard && sourceList.id !== destList.id) {
                logCardMove(params.boardId, activeCard.title, sourceList.title, destList.title);
            }
        }
    }, [boardData, params.boardId]);

    if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-800 text-white">Đang tải bảng...</div>;
    if (!boardData) return <div className="h-screen w-screen flex items-center justify-center bg-gray-800 text-white">Không tìm thấy bảng.</div>;

    const { title, workspace, lists } = boardData;

    return (
        <div className="h-screen w-screen flex flex-col font-sans">
            {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {isBoardMenuOpen && <BoardMenu onClose={() => setIsBoardMenuOpen(false)} onShowActivity={() => { setIsBoardMenuOpen(false); setIsActivityFeedOpen(true); }} />}
            {isActivityFeedOpen && <ActivityFeed boardId={params.boardId} onClose={() => setIsActivityFeedOpen(false)} />}

            <header className="bg-purple-800/80 ...">
                {/* Header chính */}
            </header>

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
                                            boardId={params.boardId}
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
                                        <AddListForm boardId={params.boardId} onCancel={() => setIsAddingList(false)} onListCreated={() => { fetchBoardData(); setIsAddingList(false); }} />
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