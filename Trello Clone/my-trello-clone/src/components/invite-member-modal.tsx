'use client';

import React, { useState } from 'react';
import { LuX } from 'react-icons/lu';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DUMMY_SUGGESTIONS = [
    'contact@example.com',
    'another.user@domain.com',
    'test.account@email.org',
    'john.doe@work.net',
];

export const InviteMemberModal = ({ isOpen, onClose }: InviteMemberModalProps) => {
    const [showSuggestions, setShowSuggestions] = useState(false);

    if (!isOpen) {
        return null;
    }

    return (
        // LỚP PHỦ NỀN - ĐÃ ĐƯỢC CẬP NHẬT Ở ĐÂY
        <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={onClose}
        >
            {/*
        Ghi chú: bg-black/30 là một cách viết tắt trong Tailwind v3+ cho bg-black và bg-opacity-30.
        Bạn có thể dùng cách nào cũng được.
      */}
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Mời vào Không gian làm việc</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <LuX size={24} />
                    </button>
                </div>

                <div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Địa chỉ email hoặc tên"
                            className="w-full p-2 border border-blue-500 rounded-md focus:ring-2 focus:ring-blue-300 outline-none"
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay để có thể click vào gợi ý
                        />

                        {showSuggestions && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
                                {DUMMY_SUGGESTIONS.map((email, index) => (
                                    <div
                                        key={index}
                                        className="p-3 hover:bg-gray-100 cursor-pointer text-gray-700"
                                        onClick={() => {
                                            console.log(`Selected: ${email}`);
                                            setShowSuggestions(false);
                                        }}
                                    >
                                        {email}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700"
                        >
                            Gửi lời mời
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};