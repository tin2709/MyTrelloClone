'use client';

import React, { useRef, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { createCard } from '../card-actions';

interface AddCardFormProps {
    listId: string;
    boardId: string;
    onCancel: () => void;
    onCardCreated: () => void;
}

export const AddCardForm = ({ listId, boardId, onCancel, onCardCreated }: AddCardFormProps) => {
    const initialState = { success: false, error: undefined };
    const [state, formAction] = useFormState(createCard, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const { pending } = useFormStatus();

    useEffect(() => {
        if (state.success) {
            onCardCreated();
            formRef.current?.reset();
            formRef.current?.querySelector('textarea')?.focus();
        } else if (state.error) {
            alert(state.error);
        }
    }, [state, onCardCreated]);

    return (
        <form action={formAction} ref={formRef} className="px-1">
            <input type="hidden" name="listId" value={listId} />
            <input type="hidden" name="boardId" value={boardId} />
            <textarea
                name="title"
                placeholder="Nhập tiêu đề cho thẻ này..."
                autoFocus
                className="w-full p-2 rounded-md shadow-sm resize-none focus:outline-none"
                rows={3}
            />
            <div className="flex items-center gap-2 mt-2">
                <button type="submit" disabled={pending} className="bg-blue-600 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400">
                    {pending ? 'Đang thêm...' : 'Thêm thẻ'}
                </button>
                <button type="button" onClick={onCancel} className="p-2 hover:bg-gray-300 rounded-full">
                    <LuX size={20} />
                </button>
            </div>
        </form>
    );
};