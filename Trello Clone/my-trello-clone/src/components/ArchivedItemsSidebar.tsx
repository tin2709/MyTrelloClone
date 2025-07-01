// /components/ArchivedItemsSidebar.tsx

'use client';

import React from 'react';
import { LuX, LuChevronLeft, LuList } from 'react-icons/lu';
// Đường dẫn import có thể cần điều chỉnh tùy theo cấu trúc thư mục của bạn
import { ArchivedCard } from '@/app/board/[boardId]/list-actions';

// --- TYPES ---
export interface ArchivedListItem {
    id: string;
    title: string;
}

export type ArchivedCardItem = ArchivedCard;

// --- PROPS ---
interface ArchivedItemsSidebarProps {
    // Dữ liệu và trạng thái
    activeTab: 'lists' | 'cards';
    searchTerm: string;
    isLoading: boolean;
    archivedLists: ArchivedListItem[];
    archivedCards: ArchivedCardItem[];

    // Các hàm xử lý
    onClose: () => void;
    onBack: () => void;
    onTabChange: (tab: 'lists' | 'cards') => void;
    onSearchChange: (value: string) => void;
    // Actions cho List
    onRestoreList: (listId: string) => void;
    onDeleteList: (listId: string) => void;
    // --- SỬA ĐỔI: Thay đổi kiểu dữ liệu của hàm callback ---
    // Actions cho Card giờ sẽ nhận cả đối tượng card
    onRestoreCard: (card: ArchivedCardItem) => void;
    onDeleteCard: (card: ArchivedCardItem) => void;
}

const ArchivedItemsSidebar = ({
                                  activeTab,
                                  searchTerm,
                                  isLoading,
                                  archivedLists,
                                  archivedCards,
                                  onClose,
                                  onBack,
                                  onTabChange,
                                  onSearchChange,
                                  onRestoreList,
                                  onDeleteList,
                                  onRestoreCard,
                                  onDeleteCard,
                              }: ArchivedItemsSidebarProps) => {

    const filteredLists = archivedLists.filter(list => list.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredCards = archivedCards.filter(card => card.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="absolute top-14 right-4 w-80 bg-white rounded-lg shadow-xl z-40 flex flex-col">
            {/* Header */}
            <div className="relative text-center p-3 border-b flex-shrink-0">
                <button onClick={onBack} className="absolute top-1/2 left-2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100">
                    <LuChevronLeft />
                </button>
                <h3 className="font-semibold text-gray-700">Mục đã lưu trữ</h3>
                <button onClick={onClose} className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100">
                    <LuX />
                </button>
            </div>

            {/* Search and Tabs */}
            <div className="p-3 pb-2 border-b flex-shrink-0">
                <input
                    type="text"
                    placeholder="Tìm kiếm lưu trữ..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <div className="mt-3 flex justify-around">
                    <button
                        onClick={() => onTabChange('cards')}
                        className={`w-1/2 text-center py-2 text-sm font-medium border-b-2 ${activeTab === 'cards' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}
                    >
                        Thẻ
                    </button>
                    <button
                        onClick={() => onTabChange('lists')}
                        className={`w-1/2 text-center py-2 text-sm font-medium border-b-2 ${activeTab === 'lists' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}
                    >
                        Danh sách
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3 overflow-y-auto flex-grow">
                {isLoading ? (
                    <p className="text-gray-500 text-sm text-center">Đang tải...</p>
                ) : (
                    <>
                        {/* --- NỘI DUNG TAB DANH SÁCH --- */}
                        {activeTab === 'lists' && (
                            <div className="space-y-1">
                                {filteredLists.length > 0 ? (
                                    filteredLists.map((list) => (
                                        <div key={list.id} className="p-2 rounded-md hover:bg-gray-50">
                                            <div className="flex items-center gap-2">
                                                <LuList className="text-gray-400 shrink-0"/>
                                                <span className="text-gray-800 truncate pr-2 font-medium">{list.title}</span>
                                            </div>
                                            <div className="mt-1 text-xs">
                                                <button onClick={() => onRestoreList(list.id)} className="text-gray-500 hover:underline">Khôi phục</button>
                                                <span className="mx-1 text-gray-400">•</span>
                                                <button onClick={() => onDeleteList(list.id)} className="text-gray-500 hover:underline hover:text-red-600">Xóa</button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 py-4">
                                        <p>Không có danh sách nào được lưu trữ.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- NỘI DUNG TAB THẺ --- */}
                        {activeTab === 'cards' && (
                            <div className="space-y-1">
                                {filteredCards.length > 0 ? (
                                    filteredCards.map((card) => (
                                        <div key={card.id} className="p-2 rounded-md border bg-white shadow-sm">
                                            <p className="font-medium text-gray-800">{card.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                trong danh sách <span className="font-semibold">{card.Lists?.title || 'Không xác định'}</span>
                                            </p>
                                            <div className="mt-2 text-xs">
                                                {/* --- SỬA ĐỔI: Truyền cả đối tượng `card` --- */}
                                                <button onClick={() => onRestoreCard(card)} className="text-gray-600 hover:underline">Khôi phục</button>
                                                <span className="mx-1 text-gray-400">•</span>
                                                <button onClick={() => onDeleteCard(card)} className="text-gray-600 hover:underline hover:text-red-600">Xóa</button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 py-4">
                                        <p>Không có thẻ nào được lưu trữ.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ArchivedItemsSidebar;