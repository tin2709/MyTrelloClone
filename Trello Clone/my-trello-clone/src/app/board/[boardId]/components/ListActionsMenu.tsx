// /components/ListActionsMenu.tsx

'use client';

import React, { useRef, useEffect } from 'react';
import { LuX } from 'react-icons/lu';

interface ListActionsMenuProps {
    onClose: () => void;
    onAddCardClick: () => void;
    onCopyClick: () => void;
    onMoveClick: () => void;
    onMoveAllCardsClick: () => void;
    onArchiveClick: () => void;
    onArchiveAllCardsClick: () => void; // Thêm prop này
}

export const ListActionsMenu = ({
                                    onClose,
                                    onAddCardClick,
                                    onCopyClick,
                                    onMoveClick,
                                    onMoveAllCardsClick,
                                    onArchiveClick,
                                    onArchiveAllCardsClick // Thêm prop này
                                }: ListActionsMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} className="absolute top-10 right-0 w-64 bg-white rounded-md shadow-lg z-20 border">
            <div className="flex items-center justify-between p-2 border-b">
                <span className="text-sm font-medium text-gray-500 mx-auto">Thao tác</span>
                <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                    <LuX size={16} />
                </button>
            </div>
            <nav className="p-1">
                <button onClick={() => { onAddCardClick(); onClose(); }} className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100">Thêm thẻ</button>
                <button onClick={() => { onCopyClick(); onClose(); }} className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100">Sao chép danh sách</button>
                <button onClick={() => { onMoveClick(); onClose(); }} className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100">Di chuyển danh sách</button>
                <button onClick={() => { onMoveAllCardsClick(); onClose(); }} className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100">Di chuyển tất cả thẻ trong danh sách này</button>
                <hr className="my-1" />
                <button
                    onClick={() => { onArchiveAllCardsClick(); onClose(); }} // <<< SỬA Ở ĐÂY
                    className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100">
                    Lưu trữ tất cả thẻ trong danh sách này
                </button>
                <button
                    onClick={() => { onArchiveClick(); onClose(); }}
                    className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100"
                >
                    Lưu trữ danh sách này
                </button>
            </nav>
        </div>
    );
};