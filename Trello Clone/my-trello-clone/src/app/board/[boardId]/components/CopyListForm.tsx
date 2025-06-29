'use client';

import React, { useRef, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { copyList } from '../list-actions';

// Interface này nên được import từ một file types chung
interface List { id: string; title: string; }

interface CopyListFormProps {
    originalList: List;
    boardId: string;
    onClose: () => void;
    onListCopied: () => void;
}

export const CopyListForm = ({ originalList, boardId, onClose, onListCopied }: CopyListFormProps) => {
    const initialState = { success: false, error: undefined, errors: undefined };
    const [state, formAction] = useFormState(copyList, initialState);
    const { pending } = useFormStatus();
    const containerRef = useRef<HTMLDivElement>(null);

    // Xử lý đóng popup khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Xử lý sau khi form được submit
    useEffect(() => {
        if (state.success) {
            onListCopied();
            onClose();
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
            onClose();
        }
    }, [state, onListCopied, onClose]);

    return (
        <div className="absolute inset-0 bg-gray-900/30 z-20 flex items-start justify-center p-2">
            <div
                ref={containerRef}
                className="w-full bg-gray-100 rounded-lg shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative text-center border-b border-gray-300 py-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                        Sao chép danh sách
                    </h3>
                    <button
                        onClick={onClose}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full"
                    >
                        <LuX size={16} />
                    </button>
                </div>
                <div className="p-2">
                    <form action={formAction}>
                        <input type="hidden" name="originalListId" value={originalList.id} />
                        <input type="hidden" name="boardId" value={boardId} />
                        <input type="hidden" name="originalListTitle" value={originalList.title} /> {/* Thêm để ghi log */}

                        <label htmlFor="title" className="text-xs font-bold text-gray-600">
                            Tên
                        </label>
                        <textarea
                            name="title"
                            id="title"
                            defaultValue={originalList.title}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            className="w-full mt-1 p-2 border-2 border-blue-500 rounded-md focus:outline-none resize-none"
                            rows={3}
                        />
                        {state.errors?.title && (
                            <p className="text-red-500 text-xs mt-1">
                                {state.errors.title}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={pending}
                            className="w-full mt-2 bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {pending ? 'Đang tạo...' : 'Tạo danh sách'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};