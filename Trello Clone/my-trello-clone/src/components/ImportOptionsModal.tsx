'use client';

import React from 'react';
import { LuFileWarning, LuMerge, LuReplace, LuX, LuLoader } from 'react-icons/lu';

interface ImportOptionsModalProps {
    onConfirm: (mode: 'merge' | 'replace') => void;
    onCancel: () => void;
    isImporting: boolean;
}

export const ImportOptionsModal = ({ onConfirm, onCancel, isImporting }: ImportOptionsModalProps) => {
    return (
        // Lớp phủ toàn màn hình
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            {/* Hộp thoại chính */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                {/* Nút đóng */}
                <button
                    onClick={onCancel}
                    disabled={isImporting}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                    <LuX size={20} />
                </button>

                {/* Nội dung hộp thoại */}
                <div className="text-center">
                    <LuFileWarning className="mx-auto h-12 w-12 text-yellow-500" />
                    <h3 className="mt-2 text-xl font-semibold text-gray-800">Xác nhận nhập dữ liệu</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Bạn sắp nhập dữ liệu từ tệp JSON. Vui lòng chọn cách bạn muốn tiếp tục.
                    </p>
                </div>

                {/* Các nút hành động */}
                <div className="mt-6 space-y-3">
                    {/* Nút Giữ lại & Thêm mới (Merge) */}
                    <button
                        onClick={() => onConfirm('merge')}
                        disabled={isImporting}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all"
                    >
                        {isImporting ? (
                            <LuLoader size={18} className="animate-spin" />
                        ) : (
                            <LuMerge size={18} />
                        )}
                        <span>Giữ dữ liệu cũ & Thêm mới</span>
                    </button>

                    {/* Nút Xóa hết & Thay thế (Replace) */}
                    <button
                        onClick={() => onConfirm('replace')}
                        disabled={isImporting}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-all"
                    >
                        {isImporting ? (
                            <LuLoader size={18} className="animate-spin" />
                        ) : (
                            <LuReplace size={18} />
                        )}
                        <span>Xóa hết dữ liệu cũ & Thay thế</span>
                    </button>
                </div>

                {/* Văn bản cảnh báo */}
                <p className="mt-4 text-xs text-gray-500 text-center">
                    <strong>Cảnh báo:</strong> Hành động xóa hết không thể hoàn tác.
                </p>
            </div>
        </div>
    );
};