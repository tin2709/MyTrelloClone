'use client';

import React, { useState, useEffect } from 'react';

// Kiểu dữ liệu cho một ảnh từ Pixabay
interface PixabayImage {
    id: number;
    webformatURL: string; // Ảnh nhỏ để hiển thị trong grid
    largeImageURL: string; // Ảnh lớn để làm nền
}

const PREDEFINED_COLORS = [
    '#0079BF', '#D29034', '#519839', '#B04632', '#89609E',
    '#CD5A91', '#4BBF6B', '#00AECC', '#838C91'
];

interface BackgroundPickerProps {
    onSelect: (background: string) => void;
}

const BackgroundPicker = ({ onSelect }: BackgroundPickerProps) => {
    const [activeTab, setActiveTab] = useState<'photos' | 'colors'>('photos');
    const [photos, setPhotos] = useState<PixabayImage[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Chỉ fetch khi tab 'photos' được chọn và chưa có ảnh
        if (activeTab === 'photos' && photos.length === 0) {
            const fetchPixabayPhotos = async () => {
                setLoading(true);
                try {
                    // Lấy API key từ biến môi trường
                    const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
                    if (!apiKey) {
                        console.error("Pixabay API key không được tìm thấy!");
                        return;
                    }

                    // Gọi API - tìm kiếm ảnh ngang, chủ đề "thiên nhiên" để phù hợp làm nền
                    const response = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=nature+background&image_type=photo&orientation=horizontal&per_page=20`);
                    const data = await response.json();
                    setPhotos(data.hits);

                } catch (error) {
                    console.error("Lỗi khi fetch ảnh từ Pixabay:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchPixabayPhotos();
        }
    }, [activeTab, photos.length]);

    return (
        <div className="p-2">
            <div className="flex gap-2 mb-3">
                <button
                    onClick={() => setActiveTab('photos')}
                    className={`flex-1 p-2 rounded text-sm font-semibold ${activeTab === 'photos' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    Ảnh
                </button>
                <button
                    onClick={() => setActiveTab('colors')}
                    className={`flex-1 p-2 rounded text-sm font-semibold ${activeTab === 'colors' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    Màu
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                {activeTab === 'photos' && (
                    loading
                        ? <p className="col-span-2 text-center text-gray-500">Đang tải ảnh...</p>
                        : photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="h-20 rounded-md cursor-pointer bg-cover bg-center"
                                style={{ backgroundImage: `url(${photo.webformatURL})` }}
                                onClick={() => onSelect(photo.largeImageURL)}
                            />
                        ))
                )}
                {activeTab === 'colors' && (
                    PREDEFINED_COLORS.map(color => (
                        <div
                            key={color}
                            className="h-20 rounded-md cursor-pointer"
                            style={{ backgroundColor: color }}
                            onClick={() => onSelect(color)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default BackgroundPicker;