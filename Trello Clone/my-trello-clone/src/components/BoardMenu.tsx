// BoardMenu.tsx (file bạn đã cung cấp)

'use client';

import React, { useRef, useEffect, useState } from 'react';
// CẬP NHẬT: Thay LuFile bằng LuFileJson để icon rõ ràng hơn
import {
    LuX,
    LuList,
    LuArchive,
    LuSettings,
    LuImage,
    LuArrowLeft,
    LuFileJson,
    LuLayoutTemplate,
    LuFileUp
} from 'react-icons/lu';
import BackgroundPicker from './BackgroundPicker';

// CẬP NHẬT: Thêm prop mới vào interface
interface BoardMenuProps {
    onClose: () => void;
    onShowActivity: () => void;
    onShowArchive: () => void;
    onBackgroundChange: (background: string) => void;
    onExportJson: () => void; // Prop mới để gọi hàm export
    onExportStructure: () => void; // Prop mới để xuất cấu trúc
    onImportJson: (jsonContent: string) => void;


}

// CẬP NHẬT: Nhận prop mới từ destructuring
const BoardMenu = ({ onClose, onShowActivity, onShowArchive, onBackgroundChange, onExportJson,  onExportStructure,     onImportJson // Nhận prop mới
                   }: BoardMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<'main' | 'background'>('main');
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref cho input file

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
    };
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            onImportJson(content); // Gửi nội dung file về component cha
            onClose(); // Đóng menu sau khi chọn file
        };
        reader.readAsText(file);

        // Reset input để có thể chọn lại cùng một file
        event.target.value = '';
    };

    return (
        <div
            ref={menuRef}
            className="absolute top-14 right-4 w-80 bg-gray-50 rounded-lg shadow-xl z-40 flex flex-col"
        >
            {/* Header động (không thay đổi) */}
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
                        {/* Các nút khác giữ nguyên */}
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
                        <button
                            onClick={() => setView('background')}
                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800"
                        >
                            <LuImage size={20} />
                            <span className="font-medium">Thay đổi hình nền</span>
                        </button>

                        <hr className="my-2" />
                        <button
                            onClick={() => fileInputRef.current?.click()} // Mở hộp thoại chọn file
                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800"
                        >
                            <LuFileUp size={20} />
                            <span className="font-medium">Nhập từ JSON</span>
                        </button>
                        {/* Input file ẩn */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".json"
                            onChange={handleFileSelect}
                        />
                        {/* CẬP NHẬT: Nút xuất JSON giờ sẽ gọi hàm từ props */}
                        <button
                            onClick={onExportJson} // Gọi hàm được truyền từ component cha
                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800"
                        >
                            <LuFileJson size={20} /> {/* Sử dụng icon mới */}
                            <span className="font-medium">Xuất ra JSON</span>
                        </button>
                        <button
                            onClick={onExportStructure}
                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-800"
                        >
                            <LuLayoutTemplate size={20} />
                            <span className="font-medium">Xuất cấu trúc bảng (JSON)</span>
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