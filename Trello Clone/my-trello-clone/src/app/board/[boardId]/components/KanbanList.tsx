// /components/KanbanList.tsx

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuMoveHorizontal, LuPlus } from 'react-icons/lu';
import { KanbanCard } from './KanbanCard';
import { AddCardForm } from './AddCardForm';
import { ListActionsMenu } from './ListActionsMenu';
import { CopyListForm } from './CopyListForm';
import { MoveListForm } from './MoveListForm';
import { MoveAllCardsMenu } from './MoveAllCardsMenu';
import { archiveList, archiveAllCardsInList } from '../list-actions';
import type { List, Card } from '../types';



interface KanbanListProps {
    list: List;
    boardId: string;
    allLists: List[];
    onCardCreated: () => void;
    onListUpdated: () => void;
    onShowToast: (message: string) => void;
}

export const KanbanList = ({
                               list,
                               boardId,
                               allLists,
                               onCardCreated,
                               onListUpdated,
                               onShowToast
                           }: KanbanListProps) => {
    // ... (Toàn bộ phần logic của component này không thay đổi)
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isMovingAllCards, setIsMovingAllCards] = useState(false);

    // Logic cho việc lưu trữ DANH SÁCH
    const [archiveListState, archiveListFormAction] = useFormState(archiveList, { success: false });
    const archiveListFormRef = useRef<HTMLFormElement>(null);

    // Logic cho việc lưu trữ tất cả THẺ
    const [archiveCardsState, archiveCardsFormAction] = useFormState(archiveAllCardsInList, { success: false });
    const archiveCardsFormRef = useRef<HTMLFormElement>(null);

    // Xử lý kết quả trả về của action LƯU TRỮ DANH SÁCH
    useEffect(() => {
        if (archiveListState.success) {
            onShowToast(`Đã lưu trữ danh sách "${list.title}".`);
            onListUpdated();
        } else if (archiveListState.error) {
            onShowToast(`Lỗi: ${archiveListState.error}`);
        }
    }, [archiveListState, list.title, onListUpdated, onShowToast]);

    // Xử lý kết quả trả về của action LƯU TRỮ TẤT CẢ THẺ
    useEffect(() => {
        if (archiveCardsState.success) {
            onShowToast(`Đã lưu trữ tất cả thẻ trong danh sách "${list.title}".`);
            onListUpdated();
        } else if (archiveCardsState.error) {
            onShowToast(`Lỗi: ${archiveCardsState.error}`);
        }
    }, [archiveCardsState, list.title, onListUpdated, onShowToast]);


    const handleArchiveListClick = () => {
        archiveListFormRef.current?.requestSubmit();
    };

    const handleArchiveAllCardsClick = () => {
        archiveCardsFormRef.current?.requestSubmit();
    };

    const handleCopyClick = () => { setIsMenuOpen(false); setIsCopying(true); };
    const handleMoveClick = () => { setIsMenuOpen(false); setIsMoving(true); };
    const handleMoveAllCardsClick = () => { setIsMenuOpen(false); setIsMovingAllCards(true); };

    const handleCardsMoved = (sourceTitle: string, destTitle: string) => {
        onListUpdated();
        onShowToast(`Đã chuyển tất cả thẻ từ "${sourceTitle}" sang "${destTitle}".`);
    };

    const cardIds = useMemo(() => list.cards.map(card => card.id), [list.cards]);

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: list.id,
        data: { type: 'List', list },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative w-72 bg-gray-100 rounded-lg p-1 shrink-0 h-fit">
            {isCopying && <CopyListForm originalList={list} boardId={boardId} onClose={() => setIsCopying(false)} onListCopied={onListUpdated} />}
            {isMoving && <MoveListForm listToMove={list} currentBoardId={boardId} onClose={() => setIsMoving(false)} onListMoved={onListUpdated} />}
            {isMovingAllCards && <MoveAllCardsMenu sourceList={list} boardId={boardId} allLists={allLists} onClose={() => setIsMovingAllCards(false)} onCardsMoved={handleCardsMoved} />}

            <div {...attributes} {...listeners} className="flex justify-between items-center p-2 mb-1 cursor-grab active:cursor-grabbing">
                <h3 className="font-semibold text-gray-700">{list.title}</h3>
                <button onClick={() => setIsMenuOpen(true)} className="p-1.5 hover:bg-gray-300 rounded-md" onMouseDown={(e) => e.stopPropagation()}>
                    <LuMoveHorizontal />
                </button>
                {isMenuOpen && (
                    <ListActionsMenu
                        onClose={() => setIsMenuOpen(false)}
                        onAddCardClick={() => setIsAddingCard(true)}
                        onCopyClick={handleCopyClick}
                        onMoveClick={handleMoveClick}
                        onMoveAllCardsClick={handleMoveAllCardsClick}
                        onArchiveClick={handleArchiveListClick}
                        onArchiveAllCardsClick={handleArchiveAllCardsClick}
                    />
                )}
            </div>

            <form ref={archiveListFormRef} action={archiveListFormAction} className="hidden">
                <input type="hidden" name="id" value={list.id} />
                <input type="hidden" name="boardId" value={boardId} />
                <input type="hidden" name="title" value={list.title} />
            </form>

            <form ref={archiveCardsFormRef} action={archiveCardsFormAction} className="hidden">
                <input type="hidden" name="listId" value={list.id} />
                <input type="hidden" name="boardId" value={boardId} />
                <input type="hidden" name="listTitle" value={list.title} />
            </form>

            <SortableContext items={cardIds}>
                <div className="px-1 pt-1 pb-2 space-y-2 min-h-[40px] rounded-md">
                    {list.cards.map((card) => <KanbanCard key={card.id} boardId={boardId} card={card} />)}
                </div>
            </SortableContext>
            {isAddingCard ? (
                <AddCardForm listId={list.id} boardId={boardId} onCancel={() => setIsAddingCard(false)} onCardCreated={onCardCreated} />
            ) : (
                <button onClick={() => setIsAddingCard(true)} className="w-full text-left p-2 mt-1 hover:bg-gray-200 rounded-md text-gray-600 flex items-center gap-2">
                    <LuPlus /> Thêm thẻ
                </button>
            )}
        </div>
    );
};