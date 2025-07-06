// app/(main)/boards/[boardId]/@modal/(..)[cardId]/components/checklist-form-popup.jsx
'use client';

// React & Next.js Core
import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';

// Server Actions
import { createChecklist } from '../../../checklist-actions';

// Icons
import { LuX } from 'react-icons/lu';

// --- TYPE DEFINITIONS ---
interface ChecklistItem { id: string; text: string; is_completed: boolean; position: number; checklist_id: string; }
interface Checklist { id: string; title: string; card_id: string; position: number; checklist_items: ChecklistItem[]; }

export function ChecklistFormPopup({ cardId, boardId, onAdd, onCancel }: {
    cardId: string, boardId: string, onAdd: (newChecklist: Checklist) => void, onCancel: () => void
}) {
    const [state, formAction, isPending] = useActionState(createChecklist, { success: false });
    const [title, setTitle] = useState("Việc cần làm");

    useEffect(() => {
        if (state.success && state.checklist) {
            onAdd({ ...state.checklist, checklist_items: [] });
            onCancel();
        }
        if (state.error) {
            alert(`Lỗi: ${state.error}`);
        }
    }, [state, onAdd, onCancel]);

    return (
        <div className="absolute inset-0 bg-black/10 z-20 flex items-center justify-center">
            <div className="bg-white rounded-md p-4 shadow-lg w-72">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <span className="flex-grow text-center text-sm text-gray-500 font-medium">Thêm danh sách công việc</span>
                    <button onClick={onCancel} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><LuX size={16} /></button>
                </div>
                <form action={formAction} className="space-y-3">
                    <input type="hidden" name="cardId" value={cardId} />
                    <input type="hidden" name="boardId" value={boardId} />
                    <div className="space-y-1">
                        <label htmlFor="title" className="text-xs font-bold text-gray-500">Tiêu đề</label>
                        <input id="title" name="title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <button type="submit" disabled={isPending} className="w-full px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {isPending ? 'Đang thêm...' : 'Thêm'}
                    </button>
                </form>
            </div>
        </div>
    );
};