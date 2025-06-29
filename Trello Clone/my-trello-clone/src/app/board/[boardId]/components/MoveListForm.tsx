'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { LuX, LuChevronLeft } from 'react-icons/lu';
import { createClient } from '@/lib/supabase/client';
import { moveList } from '../list-actions';

interface List { id: string; title: string; position: number; }

interface MoveListFormProps {
    listToMove: List;
    currentBoardId: string;
    onClose: () => void;
    onListMoved: () => void;
}

export const MoveListForm = ({ listToMove, currentBoardId, onClose, onListMoved }: MoveListFormProps) => {
    const supabase = createClient();
    const [movableBoards, setMovableBoards] = useState<{ id: string, title: string }[]>([]);
    const [targetBoardLists, setTargetBoardLists] = useState<{ id: string, position: number }[]>([]);
    const [targetBoardId, setTargetBoardId] = useState(currentBoardId);

    const [state, formAction] = useFormState(moveList, { success: false });
    const { pending } = useFormStatus();
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchBoards = async () => {
            const { data, error } = await supabase.from('Boards').select('id, title');
            if (error) console.error("Lỗi khi fetch các bảng:", error);
            else if (data) setMovableBoards(data);
        };
        fetchBoards();
    }, [supabase]);

    useEffect(() => {
        if (targetBoardId) {
            const fetchListsForBoard = async () => {
                const { data, error } = await supabase.from('Lists').select('id, position').eq('board_id', targetBoardId).order('position');
                if (error) console.error(`Lỗi fetch danh sách cho bảng ${targetBoardId}:`, error);
                else if (data) setTargetBoardLists(data);
            };
            fetchListsForBoard();
        }
    }, [targetBoardId, supabase]);

    useEffect(() => {
        if (state.success) {
            onListMoved();
            onClose();
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
        }
    }, [state, onListMoved, onClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (formRef.current && !formRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const positionOptions = useMemo(() => {
        const numLists = targetBoardLists.length;
        const maxPosition = targetBoardId === currentBoardId ? numLists : numLists + 1;
        return Array.from({ length: maxPosition }, (_, i) => i);
    }, [targetBoardLists, targetBoardId, currentBoardId]);

    return (
        <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-30 flex items-start justify-center p-4">
            <div ref={formRef} className="bg-white w-72 rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="relative text-center border-b p-2">
                    <button onClick={onClose} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100"><LuChevronLeft /></button>
                    <h3 className="font-semibold">Di chuyển danh sách</h3>
                    <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100"><LuX /></button>
                </div>
                <div className="p-3">
                    <form action={formAction}>
                        <input type="hidden" name="listId" value={listToMove.id} />
                        <input type="hidden" name="currentBoardId" value={currentBoardId} />

                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-500">Bảng thông tin</label>
                            <select name="targetBoardId" value={targetBoardId} onChange={(e) => setTargetBoardId(e.target.value)} className="w-full mt-1 p-2 border bg-gray-100 rounded-md">
                                {movableBoards.map(board => (
                                    <option key={board.id} value={board.id}>{board.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-500">Vị trí</label>
                            <select name="position" defaultValue={listToMove.position} className="w-full mt-1 p-2 border bg-gray-100 rounded-md">
                                {positionOptions.map(pos => (
                                    <option key={pos} value={pos}>
                                        {pos + 1}
                                        {targetBoardId === currentBoardId && pos === listToMove.position && " (hiện tại)"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" disabled={pending} className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400">
                            {pending ? 'Đang di chuyển...' : 'Di chuyển'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};