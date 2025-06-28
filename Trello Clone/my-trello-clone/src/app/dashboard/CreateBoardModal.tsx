// src/components/CreateBoardModal.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createBoard, type CreateBoardState } from '@/app/dashboard/board-actions';
import { FiX } from 'react-icons/fi';
import clsx from 'clsx';
import useTailwindBreakpoint from '@/app/hooks/use-tailwind-breakpoint';

// Định nghĩa kiểu dữ liệu cho workspace để truyền vào từ trang cha
interface Workspace {
    id: string;
    name: string;
}

interface CreateBoardModalProps {
    workspaces: Workspace[];
    isOpen: boolean;
    onClose: () => void;
}

// Nút submit để quản lý trạng thái loading (giữ nguyên)
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={clsx(
                "w-full bg-blue-600 text-white font-bold py-2 px-4 rounded",
                "hover:bg-blue-700",
                "disabled:bg-gray-400 disabled:cursor-not-allowed"
            )}
        >
            {pending ? 'Đang tạo...' : 'Tạo mới'}
        </button>
    );
}

export default function CreateBoardModal({ workspaces, isOpen, onClose }: CreateBoardModalProps) {
    const initialState: CreateBoardState = {};
    const [state, formAction] = useFormState(createBoard, initialState);
    const modalRef = useRef<HTMLDivElement>(null);
    const breakpoint = useTailwindBreakpoint();

    // SỬA ĐỔI: Chỉ xử lý đóng modal khi thành công. Lỗi sẽ được hiển thị trên UI.
    useEffect(() => {
        if (state?.success) {
            onClose();
        }
    }, [state?.success, onClose]);

    // Đóng modal khi click ra ngoài (giữ nguyên)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50">
            <div
                ref={modalRef}
                className={clsx(
                    "bg-white shadow-xl p-4 relative",
                    breakpoint === 'xs'
                        ? 'w-full h-full rounded-none mt-0' // Giao diện mobile
                        : 'rounded-lg w-full max-w-sm mt-16' // Giao diện desktop
                )}
            >
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Tạo bảng</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <FiX size={20} />
                    </button>
                </div>

                <form action={formAction} className="space-y-4">
                    {/* Phần preview ảnh nền (giữ nguyên) */}
                    <div className="h-24 bg-gray-200 rounded-md mb-4 flex items-center justify-center text-gray-500">
                        Preview Nền
                    </div>

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Tiêu đề bảng <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="workspaceId" className="block text-sm font-medium text-gray-700 mb-1">
                            Không gian làm việc
                        </label>
                        <select
                            id="workspaceId"
                            name="workspaceId"
                            required
                            defaultValue={workspaces[0]?.id || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {workspaces.map(ws => (
                                <option key={ws.id} value={ws.id}>{ws.name}</option>
                            ))}
                        </select>
                    </div>

                    <SubmitButton />

                    {/* THÊM MỚI: Hiển thị thông báo lỗi ngay trong form */}
                    {state?.error && (
                        <p className="text-sm text-red-600 text-center">
                            {state.error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}