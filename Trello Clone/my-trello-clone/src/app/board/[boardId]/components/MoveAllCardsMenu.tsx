'use client';

import React, { useRef, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { LuX, LuChevronLeft } from 'react-icons/lu';
import { moveAllCards } from '../list-actions';

interface List { id: string; title: string; }

interface MoveAllCardsMenuProps {
    sourceList: List;
    boardId: string;
    allLists: List[];
    onClose: () => void;
    onCardsMoved: (sourceTitle: string, destTitle: string) => void;
}

export const MoveAllCardsMenu = ({ sourceList, boardId, allLists, onClose, onCardsMoved }: MoveAllCardsMenuProps) => {
    const initialState = { success: false, error: undefined };
    const [state, formAction] = useFormState(moveAllCards, initialState);
    const menuRef = useRef<HTMLDivElement>(null);
    const submittedFormRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        if(state.success && submittedFormRef.current) {
            const destId = (submittedFormRef.current.elements.namedItem('destinationListId') as HTMLInputElement)?.value;
            const destList = allLists.find(l => l.id === destId);
            onCardsMoved(sourceList.title, destList?.title || '');
            onClose();
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
            onClose();
        }
    }, [state, onClose, onCardsMoved, allLists, sourceList.title]);

    return (
        <div ref={menuRef} className="absolute top-0 left-0 w-full h-full bg-white rounded-md shadow-lg z-30 border">
            <div className="relative flex items-center justify-center p-2 border-b">
                <button onClick={onClose} className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                    <LuChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium text-gray-600 truncate px-8">
                    Di chuyển thẻ trong {sourceList.title}
                </span>
                <button onClick={onClose} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                    <LuX size={16} />
                </button>
            </div>
            <div className="p-1">
                {allLists.map(list => {
                    if (list.id === sourceList.id) {
                        return (
                            <div key={list.id} className="text-left text-sm px-3 py-1.5 text-gray-400">
                                {list.title} (hiện tại)
                            </div>
                        );
                    }
                    return (
                        <form
                            key={list.id}
                            ref={el => { if (el) submittedFormRef.current = el; }}
                            action={formAction}
                        >
                            <input type="hidden" name="sourceListId" value={sourceList.id} />
                            <input type="hidden" name="destinationListId" value={list.id} />
                            <input type="hidden" name="boardId" value={boardId} />
                            <button type="submit" className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100">
                                {list.title}
                            </button>
                        </form>
                    );
                })}
            </div>
        </div>
    );
};