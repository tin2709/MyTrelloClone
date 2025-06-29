'use client';

import React, { useEffect } from 'react';
import { LuList, LuX } from 'react-icons/lu';

interface ToastNotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

export const ToastNotification = ({ message, type, onClose }: ToastNotificationProps) => {
    // Tự động đóng toast sau 5 giây
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        // Cleanup function để hủy timer nếu component bị unmount
        return () => clearTimeout(timer);
    }, [onClose]);

    // Các lớp CSS cơ sở và cho từng loại toast
    const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 w-full max-w-md p-4 rounded-lg shadow-lg z-50 flex items-center gap-3";
    const typeClasses = type === 'success'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';

    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <LuList className={`text-2xl ${iconColor}`} />
            <p className="flex-grow text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-black/10"
            >
                <LuX />
            </button>
        </div>
    );
};