'use client';

import React, { useRef, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { createList } from '../list-actions';

interface AddListFormProps {
    boardId: string;
    onCancel: () => void;
    onListCreated: () => void;
}

export const AddListForm = ({ boardId, onCancel, onListCreated }: AddListFormProps) => {
    const initialState = { success: false, error: undefined, errors: undefined, list: undefined };
    const [state, formAction] = useFormState(createList, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const { pending } = useFormStatus();

    useEffect(() => {
        if (state.success && state.list) {
            onListCreated();
            formRef.current?.reset();
        } else if (state.error) {
            alert(state.error);
        }
    }, [state, onListCreated]);

    return (
        <div className="w-72 bg-gray-200 rounded-lg p-2 shrink-0 h-fit">
            <form action={formAction} ref={formRef}>
                <input type="hidden" name="boardId" value={boardId} />
                <input
                    type="text"
                    name="title"
                    placeholder="Nhập tên danh sách..."
                    autoFocus
                    className="w-full p-2 border-2 border-blue-500 rounded-md focus:outline-none"
                />
                {state?.errors?.title && (
                    <p className="text-red-500 text-xs mt-1">
                        {state.errors.title}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                    <button
                        type="submit"
                        disabled={pending}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {pending ? 'Đang thêm...' : 'Thêm danh sách'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-300 rounded-full"
                    >
                        <LuX size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};