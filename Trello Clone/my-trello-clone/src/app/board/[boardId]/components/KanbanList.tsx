'use client';

import React, { useState, useMemo } from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuMoveHorizontal, LuPlus } from 'react-icons/lu';
import { KanbanCard } from './KanbanCard';
import { AddCardForm } from './AddCardForm';
import { ListActionsMenu } from './ListActionsMenu';
import { CopyListForm } from './CopyListForm';
import { MoveListForm } from './MoveListForm';
import { MoveAllCardsMenu } from './MoveAllCardsMenu';

// Các interface này có thể được import từ một file type chung
interface Card { id: string; title: string; position: number; list_id: string; }
interface List { id: string; title: string; position: number; cards: Card[]; }

interface KanbanListProps {
    list: List;
    boardId: string;
    allLists: List[];
    onCardCreated: () => void;
    onListUpdated: () => void;
    onShowToast: (message: string) => void;
}

export const KanbanList = ({ list, boardId, allLists, onCardCreated, onListUpdated, onShowToast }: KanbanListProps) => {
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isMovingAllCards, setIsMovingAllCards] = useState(false);

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
                {isMenuOpen && <ListActionsMenu onClose={() => setIsMenuOpen(false)} onAddCardClick={() => setIsAddingCard(true)} onCopyClick={handleCopyClick} onMoveClick={handleMoveClick} onMoveAllCardsClick={handleMoveAllCardsClick} />}
            </div>

            <SortableContext items={cardIds}>
                <div className="px-1 pt-1 pb-2 space-y-2 min-h-[40px] rounded-md">
                    {list.cards.map((card) => <KanbanCard key={card.id} boardId={boardId} card={card as Card} />)}
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