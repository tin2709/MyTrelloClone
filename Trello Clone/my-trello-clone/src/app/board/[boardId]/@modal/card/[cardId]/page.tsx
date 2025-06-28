// src/app/board/[boardId]/(@modal)/card/[cardId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateCardDescription } from '../../../card-actions';
import {
    LuX, LuCreditCard, LuAlignLeft, LuListOrdered, LuUser, LuTag,
    LuClock, LuPaperclip, LuImage
} from 'react-icons/lu';
import { DescriptionEditor } from '@/components/DescriptionEditor';
import DOMPurify from 'dompurify';

// --- TYPES ---
interface CardDetails {
    id: string;
    title: string;
    description: string | null;
    list: { title: string } | null;
}

// --- COMPONENTS PHỤ ---
const ActionButton = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => ( <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-sm bg-gray-200/60 hover:bg-gray-200/90 text-gray-800 text-sm font-medium"> <Icon size={16} className="text-gray-600" /> <span>{text}</span> </button> );
const SectionHeader = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children?: React.ReactNode }) => ( <div className="flex items-start gap-4"> <Icon size={24} className="text-gray-500 mt-1 shrink-0" /> <div className="w-full"> <div className="flex items-center justify-between"> <h3 className="text-base font-semibold text-gray-700">{title}</h3> {children} </div> </div> </div> );

// --- COMPONENT CHÍNH CỦA MODAL ---
export default function CardModal({ params }: { params: { boardId: string, cardId: string }}) {
    const router = useRouter();
    const supabase = createClient();
    const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    useEffect(() => {
        const fetchCardDetails = async () => {
            const { data, error } = await supabase
                .from('Cards')
                .select(`id, title, description, list:Lists(title)`)
                .eq('id', params.cardId)
                .single();
            if (error) {
                console.error("Lỗi fetch chi tiết thẻ:", error);
                router.back(); // Nếu không tìm thấy thẻ, quay lại trang trước
            } else {
                setCardDetails(data as CardDetails);
            }
            setLoading(false);
        };
        fetchCardDetails();
    }, [params.cardId, supabase, router]);

    const handleSaveDescription = useCallback(async (htmlContent: string) => {
        if (!params.cardId || !params.boardId) return;

        const formData = new FormData();
        formData.append('cardId', params.cardId);
        formData.append('boardId', params.boardId);
        formData.append('description', htmlContent);

        const result = await updateCardDescription({ success: false }, formData);

        if (result.success) {
            setCardDetails(prev => prev ? { ...prev, description: htmlContent } : null);
            setIsEditingDescription(false);
        } else {
            alert(`Lỗi: ${result.error}`);
        }
    }, [params.cardId, params.boardId]);

    if (loading) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"><p className="text-white text-lg">Đang tải chi tiết thẻ...</p></div>;
    if (!cardDetails) return null; // Component sẽ không render gì nếu không có dữ liệu, và useEffect sẽ điều hướng về trang trước.

    return (
        <div onClick={() => router.back()} className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12 md:pt-16 px-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-gray-100 rounded-lg shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => router.back()} className="absolute top-3 right-3 p-2 text-gray-600 hover:bg-gray-200 rounded-full z-10"><LuX size={20} /></button>
                <div className="py-6 px-4 md:py-8 md:px-6">
                    <SectionHeader icon={LuCreditCard} title={cardDetails.title}>
                        <p className="text-sm text-gray-500 mt-1"> trong danh sách <span className="underline font-medium">{cardDetails.list?.title}</span> </p>
                    </SectionHeader>
                    <div className="flex flex-col md:flex-row gap-6 mt-6">
                        <div className="w-full md:w-2/3 space-y-6">
                            <section>
                                <SectionHeader icon={LuAlignLeft} title="Mô tả" />
                                <div className="pl-10 mt-2">
                                    {isEditingDescription ? (
                                        <DescriptionEditor initialContent={cardDetails.description || ''} onSave={handleSaveDescription} onCancel={() => setIsEditingDescription(false)} />
                                    ) : (
                                        <div onClick={() => setIsEditingDescription(true)} className="min-h-[56px] cursor-pointer">
                                            {cardDetails.description ? ( <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cardDetails.description) }} /> ) : ( <div className="w-full text-left bg-gray-200/80 hover:bg-gray-200 p-3 rounded-md text-gray-500 font-medium">Thêm mô tả chi tiết hơn...</div> )}
                                        </div>
                                    )}
                                </div>
                            </section>
                            <section>
                                <SectionHeader icon={LuListOrdered} title="Hoạt động" />
                                {/* Phần hoạt động có thể thêm sau */}
                            </section>
                        </div>
                        <div className="w-full md:w-1/3 space-y-2">
                            <h4 className="text-xs font-bold text-gray-500">Thêm vào thẻ</h4>
                            <ActionButton icon={LuUser} text="Thành viên" />
                            <ActionButton icon={LuTag} text="Nhãn" />
                            <ActionButton icon={LuClock} text="Ngày" />
                            <ActionButton icon={LuPaperclip} text="Đính kèm" />
                            <ActionButton icon={LuImage} text="Ảnh bìa" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}