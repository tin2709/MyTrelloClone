// src/app/board/[boardId]/(@modal)/card/[cardId]/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LuX, LuCreditCard, LuAlignLeft, LuListOrdered, LuUser, LuTag,
    LuClock, LuPaperclip, LuImage, LuPlus, LuArrowRight, LuCopy, LuArchive, LuColumns2, LuEye, LuInfo
} from 'react-icons/lu';
import { DescriptionEditor } from '@/components/DescriptionEditor';
import DOMPurify from 'dompurify';

// --- DATA GIẢ LẬP ---
const cardDetails = {
    id: '1',
    title: 'Lập kế hoạch dự án',
    listName: 'Cần làm',
    description: '<p>Trello hoạt động tốt nhất với mọi người! Nhập @ để nhắc đến đồng đội của bạn. (Họ sẽ nhận được thông báo.)</p>',
    activities: [
        {
            user: 'Phạm Trung Tín',
            action: 'đã thêm thẻ này vào danh sách Cần làm',
            timestamp: '20:36 28 thg 2, 2024'
        }
    ]
};

// --- COMPONENT PHỤ CHO MODAL (Không đổi) ---
const ActionButton = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
    <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-sm bg-gray-200/60 hover:bg-gray-200/90 text-gray-800 text-sm font-medium">
        <Icon size={16} className="text-gray-600" />
        <span>{text}</span>
    </button>
);

const ActionButtonWithTag = ({ icon: Icon, text, tagText }: { icon: React.ElementType, text: string, tagText: string }) => (
    <div className="flex items-center gap-1">
        <button className="flex-grow flex items-center gap-3 px-3 py-1.5 rounded-sm bg-gray-200/60 hover:bg-gray-200/90 text-gray-800 text-sm font-medium">
            <Icon size={16} className="text-gray-600" />
            <span>{text}</span>
        </button>
        <span className="text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-sm font-bold">{tagText}</span>
    </div>
);

const SectionHeader = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children?: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <Icon size={24} className="text-gray-500 mt-1 shrink-0" />
        <div className="w-full">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-700">{title}</h3>
                {children}
            </div>
        </div>
    </div>
);


// --- COMPONENT CHÍNH CỦA MODAL (Cập nhật logic hiển thị editor) ---
export default function CardModal({ }: { params: { cardId: string }}) {
    const router = useRouter();

    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [descriptionContent, setDescriptionContent] = useState(cardDetails.description || '');

    const handleSaveDescription = (htmlContent: string) => {
        console.log("Saving description to DB:", htmlContent);
        setDescriptionContent(htmlContent);
        setIsEditingDescription(false);
    };

    return (
        <div
            onClick={() => router.back()}
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12 md:pt-16 px-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-100 rounded-lg shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto"
            >
                <button onClick={() => router.back()} className="absolute top-3 right-3 p-2 text-gray-600 hover:bg-gray-200 rounded-full z-10">
                    <LuX size={20} />
                </button>
                <div className="py-6 px-4 md:py-8 md:pr-2 md:pl-2">
                    <div className="flex items-start gap-4 mb-4">
                        <LuCreditCard size={24} className="text-gray-500 mt-1.5 shrink-0" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{cardDetails.title}</h2>
                            <p className="text-sm text-gray-500">
                                trong danh sách <button className="underline font-medium hover:text-gray-800">{cardDetails.listName}</button>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-2/3 space-y-6">
                            <div className="flex items-center gap-4">
                                <p className="text-xs font-bold text-gray-500">Thông báo</p>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-gray-200/60 hover:bg-gray-200/90 text-gray-800 text-sm font-medium">
                                    <LuEye size={16}/> Theo dõi
                                </button>
                            </div>

                            <section>
                                <SectionHeader icon={LuAlignLeft} title="Mô tả" />
                                <div className="pl-10 mt-2">
                                    {isEditingDescription ? (
                                        <DescriptionEditor
                                            initialContent={descriptionContent}
                                            onSave={handleSaveDescription}
                                            onCancel={() => setIsEditingDescription(false)}
                                        />
                                    ) : (
                                        <div
                                            onClick={() => setIsEditingDescription(true)}
                                            className="cursor-pointer"
                                        >
                                            {descriptionContent ? (
                                                <div
                                                    className="prose prose-sm"
                                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(descriptionContent) }}
                                                />
                                            ) : (
                                                <div className="w-full text-left bg-gray-200/80 hover:bg-gray-200 p-3 rounded-md text-gray-500 font-medium">
                                                    Thêm mô tả chi tiết hơn...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <SectionHeader icon={LuListOrdered} title="Hoạt động">
                                    <button className="px-3 py-1.5 text-sm font-medium bg-gray-200/60 hover:bg-gray-200/90 rounded-sm">
                                        Hiện chi tiết
                                    </button>
                                </SectionHeader>
                                <div className="pl-10 mt-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-700 text-white flex items-center justify-center rounded-full font-bold text-sm shrink-0">PT</div>
                                        <div className="w-full p-2 border bg-white rounded-md shadow-sm">
                                            <p className="text-gray-500">Viết bình luận...</p>
                                        </div>
                                    </div>
                                    {cardDetails.activities.map((activity, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-gray-700 text-white flex items-center justify-center rounded-full font-bold text-sm shrink-0">PT</div>
                                            <div>
                                                <p className="text-sm text-gray-800">
                                                    <span className="font-bold">{activity.user}</span> {activity.action}
                                                </p>
                                                <p className="text-xs text-gray-500 hover:underline cursor-pointer">{activity.timestamp}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="w-full md:w-1/3 space-y-2">
                            <h4 className="text-xs font-bold text-gray-500">Thêm vào thẻ</h4>
                            <ActionButton icon={LuUser} text="Tham gia" />
                            <ActionButton icon={LuUser} text="Thành viên" />
                            <ActionButton icon={LuTag} text="Nhãn" />
                            <ActionButton icon={LuClock} text="Việc cần làm" />
                            <ActionButton icon={LuClock} text="Ngày" />
                            <ActionButton icon={LuPaperclip} text="Đính kèm" />
                            <ActionButton icon={LuImage} text="Ảnh bìa" />
                            <ActionButton icon={LuColumns2} text="Trường tùy chỉnh" />

                            <h4 className="text-xs font-bold text-gray-500 pt-3">Tiện ích bổ sung</h4>
                            <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-sm hover:bg-gray-200/90 text-gray-800 text-sm font-medium">
                                <LuPlus size={16}/> Thêm Tiện ích bổ sung
                            </button>

                            <h4 className="text-xs font-bold text-gray-500 pt-3 flex items-center">
                                Tự động hóa
                                <LuInfo size={12} className="ml-1"/>
                            </h4>
                            <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-sm hover:bg-gray-200/90 text-gray-800 text-sm font-medium">
                                <LuPlus size={16}/> Thêm nút
                            </button>

                            <h4 className="text-xs font-bold text-gray-500 pt-3">Thao tác</h4>
                            <ActionButton icon={LuArrowRight} text="Di chuyển" />
                            <ActionButton icon={LuCopy} text="Sao chép" />
                            <ActionButtonWithTag icon={LuArchive} text="Đổi xứng" tagText="MỚI" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}