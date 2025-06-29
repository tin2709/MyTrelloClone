// /components/BoardMenu.tsx (tạo file mới)

'use client';

import React, { useRef, useEffect } from 'react';
import { LuX, LuList, LuArchive, LuSettings, LuImage } from 'react-icons/lu';

interface BoardMenuProps {
    onClose: () => void;
    onShowActivity: () => void;
}

const BoardMenu = ({ onClose, onShowActivity }: BoardMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="absolute top-14 right-4 w-80 bg-white rounded-lg shadow-xl z-40"
        >
            <div className="relative text-center p-3 border-b">
                <h3 className="font-semibold text-gray-700">Menu</h3>
                <button
                    onClick={onClose}
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100"
                >
                    <LuX />
                </button>
            </div>
            <div className="p-2">
                <button
                    onClick={onShowActivity}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800"
                >
                    <LuList size={20} />
                    <span className="font-medium">Hoạt động</span>
                </button>
                <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800">
                    <LuArchive size={20} />
                    <span className="font-medium">Mục đã lưu trữ</span>
                </button>
                <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800">
                    <LuSettings size={20} />
                    <span className="font-medium">Cài đặt</span>
                </button>
                <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800">
                    <LuImage size={20} />
                    <span className="font-medium">Thay đổi hình nền</span>
                </button>
            </div>
        </div>
    );
};

export default BoardMenu;