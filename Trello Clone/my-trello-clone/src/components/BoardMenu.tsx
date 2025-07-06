'use client';

import React, { useRef, useEffect, useState } from 'react';
import { LuX, LuList, LuArchive, LuSettings, LuImage, LuArrowLeft } from 'react-icons/lu';
import BackgroundPicker from './BackgroundPicker'; // Import component mới

interface BoardMenuProps {
    onClose: () => void;
    onShowActivity: () => void;
    onShowArchive: () => void;
    onBackgroundChange: (background: string) => void; // Thêm prop mới
}

const BoardMenu = ({ onClose, onShowActivity, onShowArchive, onBackgroundChange }: BoardMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<'main' | 'background'>('main'); // Quản lý view

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSelectBackground = (background: string) => {
        onBackgroundChange(background);
        // Không cần đóng menu ngay để người dùng có thể thử nhiều nền khác nhau
    };

    return (
        <div
            ref={menuRef}
            className="absolute top-14 right-4 w-80 bg-gray-50 rounded-lg shadow-xl z-40 flex flex-col"
        >
            {/* Header động */}
            <div className="relative text-center p-3 border-b">
                {view !== 'main' && (
                    <button
                        onClick={() => setView('main')}
                        className="absolute top-1/2 left-2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100"
                    >
                        <LuArrowLeft />
                    </button>
                )}
                <h3 className="font-semibold text-gray-700">
                    {view === 'main' ? 'Menu' : 'Thay đổi hình nền'}
                </h3>
                <button
                    onClick={onClose}
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100"
                >
                    <LuX />
                </button>
            </div>

            {/* Nội dung động */}
            <div className="flex-1">
                {view === 'main' && (
                    <div className="p-2">
                        <button
                            onClick={onShowActivity}
                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800"
                        >
                            <LuList size={20} />
                            <span className="font-medium">Hoạt động</span>
                        </button>
                        <button onClick={onShowArchive}
                                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800">
                            <LuArchive size={20} />
                            <span className="font-medium">Mục đã lưu trữ</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800">
                            <LuSettings size={20} />
                            <span className="font-medium">Cài đặt</span>
                        </button>
                        {/* Cập nhật nút này */}
                        <button
                            onClick={() => setView('background')}
                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800"
                        >
                            <LuImage size={20} />
                            <span className="font-medium">Thay đổi hình nền</span>
                        </button>
                    </div>
                )}

                {view === 'background' && (
                    <BackgroundPicker onSelect={handleSelectBackground} />
                )}
            </div>
        </div>
    );
};

export default BoardMenu;