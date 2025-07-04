// src/app/board/[boardId]/(@modal)/card/[cardId]/page.tsx (Bản mới hoàn chỉnh)
'use client';

import React, { useState, useEffect, useCallback, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Actions
import { updateCardDescription } from '../../../card-actions';
import { createChecklist, deleteChecklist } from '../../../checklist-actions';
import {
    createChecklistItem,
    deleteChecklistItem,
    updateChecklistItemStatus
} from '../../../checklist-item-actions';

// Icons
import {
    LuX, LuCreditCard, LuAlignLeft, LuListOrdered, LuUser, LuTag,
    LuClock, LuPaperclip, LuCheck, LuTrash2
} from 'react-icons/lu';

// Components
import { DescriptionEditor } from '@/components/DescriptionEditor';
import DOMPurify from 'dompurify';

// --- TYPES ---
interface ChecklistItem {
    id: string;
    text: string;
    is_completed: boolean;
    position: number;
    checklist_id: string;
}

interface Checklist {
    id: string;
    title: string;
    card_id: string;
    position: number;
    checklist_items: ChecklistItem[];
}

interface CardDetails {
    id: string;
    title: string;
    description: string | null;
    list: { title: string } | null;
}

// =======================================================================
// --- CÁC COMPONENT CON ĐƯỢC TÁCH BIỆT ---
// =======================================================================

// --- FORM THÊM CHECKLIST MỚI (DẠNG POP-UP) ---
const ChecklistFormPopup = ({ cardId, boardId, onAdd, onCancel }: { cardId: string, boardId: string, onAdd: (newChecklist: Checklist) => void, onCancel: () => void }) => {
    const [state, formAction, isPending] = useActionState(createChecklist, { success: false });
    const [title, setTitle] = useState("Việc cần làm");

    useEffect(() => {
        if (state.success && state.checklist) {
            onAdd({ ...state.checklist, checklist_items: [] });
            onCancel();
        }
        if (state.error) {
            alert(`Lỗi: ${state.error}`);
        }
    }, [state, onAdd, onCancel]);

    const handleTitleClick = (newTitle: string) => {
        setTitle(newTitle);
    };

    return (
        // Lớp phủ mờ phía sau
        <div className="absolute inset-0 bg-black/10 z-20 flex items-center justify-center">
            <div className="bg-white rounded-md p-4 shadow-lg w-72">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <span className="flex-grow text-center text-sm text-gray-500 font-medium">Thêm danh sách công việc</span>
                    <button onClick={onCancel} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><LuX size={16} /></button>
                </div>
                <form action={formAction} className="space-y-3">
                    <input type="hidden" name="cardId" value={cardId} />
                    <input type="hidden" name="boardId" value={boardId} />

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">Đã gợi ý</label>
                        <button type="button" onClick={() => handleTitleClick("Yêu cầu hệ thống")} className="w-full flex items-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-sm">
                            <LuCheck size={16} />
                            <span className="text-sm">Yêu cầu hệ thống</span>
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="title" className="text-xs font-bold text-gray-500">Tiêu đề</label>
                        <input id="title" name="title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                    </div>

                    <button type="submit" disabled={isPending} className="w-full px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {isPending ? 'Đang thêm...' : 'Thêm'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- FORM THÊM MỤC CON VÀO CHECKLIST ---
const ChecklistItemForm = ({ checklistId, boardId, onAddItem, onCancel }: { checklistId: string, boardId: string, onAddItem: (newItem: ChecklistItem) => void, onCancel: () => void }) => {
    const formRef = React.useRef<HTMLFormElement>(null);
    const [state, formAction, isPending] = useActionState(createChecklistItem, { success: false });

    useEffect(() => {
        if (state.success && state.item) {
            onAddItem(state.item);
            formRef.current?.reset(); // Reset form sau khi thêm thành công
        }
    }, [state, onAddItem]);

    return (
        <form ref={formRef} action={formAction} className="ml-8 mt-2 space-y-2">
            <input type="hidden" name="checklistId" value={checklistId} />
            <input type="hidden" name="boardId" value={boardId} />
            <textarea name="text" placeholder="Thêm một mục..." autoFocus className="w-full p-2 border rounded-md resize-none shadow-sm" rows={2} />
            <div className="flex items-center gap-2">
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-300">
                    {isPending ? "Đang thêm..." : "Thêm"}
                </button>
                <button type="button" onClick={onCancel} className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm">Hủy</button>
            </div>
        </form>
    );
};

// --- HIỂN THỊ MỘT MỤC CON TRONG CHECKLIST ---
const ChecklistItemDisplay = ({ item, onUpdateStatus, onDeleteItem }: { item: ChecklistItem, onUpdateStatus: (itemId: string, isCompleted: boolean) => void, onDeleteItem: (itemId: string) => void }) => {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => startTransition(() => onUpdateStatus(item.id, !item.is_completed));
    const handleDelete = () => startTransition(() => { if (window.confirm("Bạn có chắc muốn xóa mục này?")) { onDeleteItem(item.id); } });

    return (
        <div className={`flex items-center gap-3 group ml-8 py-1 pr-2 rounded-md hover:bg-gray-200/70 ${isPending ? 'opacity-50' : ''}`}>
            <input type="checkbox" checked={item.is_completed} onChange={handleToggle} className="w-4 h-4 rounded form-checkbox" disabled={isPending} />
            <span className={`flex-grow text-sm ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>{item.text}</span>
            <button onClick={handleDelete} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-600 transition-opacity" disabled={isPending}><LuTrash2 size={14} /></button>
        </div>
    );
};

// --- HIỂN THỊ TOÀN BỘ CHECKLIST VÀ CÁC MỤC CON ---
const ChecklistDisplay = ({ checklist, boardId, onUpdate, onDelete }: { checklist: Checklist, boardId: string, onUpdate: (updatedChecklist: Checklist) => void, onDelete: (id: string) => void }) => {
    const [isAddingItem, setIsAddingItem] = useState(false);

    // Đảm bảo checklist_items luôn là một mảng để tránh lỗi
    const items = checklist.checklist_items || [];
    const totalItems = items.length;
    const completedItems = items.filter(item => item.is_completed).length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const handleDelete = async () => {
        if (window.confirm(`Bạn có chắc muốn xóa danh sách "${checklist.title}"?`)) {
            const result = await deleteChecklist(checklist.id, boardId);
            if (result.success) onDelete(checklist.id);
            else alert(`Lỗi: ${result.error}`);
        }
    };

    const handleAddItem = (newItem: ChecklistItem) => {
        // Cập nhật state ở component cha
        onUpdate({ ...checklist, checklist_items: [...items, newItem].sort((a,b) => a.position - b.position) });
        // CẢI TIẾN: Ẩn form thêm mục sau khi đã thêm thành công
        setIsAddingItem(false);
    };

    const handleUpdateItemStatus = async (itemId: string, isCompleted: boolean) => {
        onUpdate({ ...checklist, checklist_items: items.map(item => item.id === itemId ? { ...item, is_completed: isCompleted } : item) });
        await updateChecklistItemStatus(itemId, isCompleted, boardId);
    };

    const handleDeleteItem = async (itemId: string) => {
        onUpdate({ ...checklist, checklist_items: items.filter(item => item.id !== itemId) });
        await deleteChecklistItem(itemId, boardId);
    };

    return (
        <section className="mt-6">
            <div className="flex items-start gap-4">
                <LuCheck size={24} className="text-gray-600 mt-1 shrink-0" />
                <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 text-base">{checklist.title}</h3>
                        <button onClick={handleDelete} className="text-xs font-medium bg-gray-200/80 hover:bg-gray-200 px-3 py-1 rounded-sm">Xóa</button>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-medium text-gray-500">{progress}%</span>
                        <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
                    </div>
                    <div className="space-y-1 mt-3">
                        {items.sort((a, b) => a.position - b.position).map(item => (
                            <ChecklistItemDisplay key={item.id} item={item} onUpdateStatus={handleUpdateItemStatus} onDeleteItem={handleDeleteItem} />
                        ))}
                    </div>
                    {isAddingItem ? (
                        <ChecklistItemForm checklistId={checklist.id} boardId={boardId} onAddItem={handleAddItem} onCancel={() => setIsAddingItem(false)} />
                    ) : (
                        <button onClick={() => setIsAddingItem(true)} className="text-sm font-medium bg-gray-200/80 hover:bg-gray-200 px-3 py-1.5 rounded-sm mt-2 ml-8">Thêm một mục</button>
                    )}
                </div>
            </div>
        </section>
    );
};

// --- COMPONENT BUTTON BÊN PHẢI ---
const ActionButton = ({ icon: Icon, text, onClick }: { icon: React.ElementType, text: string, onClick?: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-sm bg-gray-200/60 hover:bg-gray-200/90 text-gray-800 text-sm font-medium">
        <Icon size={16} className="text-gray-600" />
        <span>{text}</span>
    </button>
);
const SectionHeader = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children?: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <Icon size={24} className="text-gray-500 mt-1 shrink-0" />
        <div className="w-full">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-700">{title}</h3> {children}
            </div>
        </div>
    </div>
);

// =======================================================================
// --- COMPONENT CHÍNH CỦA MODAL (ĐÃ CẬP NHẬT) ---
// =======================================================================
export default function CardModal({ params }: { params: { boardId: string, cardId: string }}) {
    const router = useRouter();
    const supabase = createClient();
    const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isAddingChecklist, setIsAddingChecklist] = useState(false);

    useEffect(() => {
        const fetchCardData = async () => {
            setLoading(true);
            const [cardRes, checklistsRes] = await Promise.all([
                supabase.from('Cards').select(`id, title, description, list:Lists(title)`).eq('id', params.cardId).single(),
                // SỬA LỖI TẠI ĐÂY: Tên bảng phải là "Checklist_Items" (viết hoa chữ I) để khớp với tên bảng trong DB
                supabase.from('Checklists').select(`*, checklist_items:Checklist_items(*)`).eq('card_id', params.cardId).order('position', { ascending: true })
            ]);

            console.log("Checklists Response:", checklistsRes);

            if (cardRes.error) {
                console.error("Card Fetch Error:", cardRes.error);
                router.back();
                return;
            }

            if (checklistsRes.error) {
                console.error("Checklist Fetch Error:", checklistsRes.error);
            }

            setCardDetails(cardRes.data as CardDetails);
            setChecklists((checklistsRes.data as unknown as Checklist[] || []).sort((a,b) => a.position - b.position));
            setLoading(false);
        };
        fetchCardData();
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

    const handleAddChecklist = (newChecklist: Checklist) => setChecklists(prev => [...prev, newChecklist].sort((a,b) => a.position - b.position));
    const handleDeleteChecklist = (checklistId: string) => setChecklists(prev => prev.filter(c => c.id !== checklistId));
    const handleUpdateChecklist = (updatedChecklist: Checklist) => setChecklists(prev => prev.map(cl => cl.id === updatedChecklist.id ? updatedChecklist : cl));

    if (loading) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"><p className="text-white text-lg">Đang tải chi tiết thẻ...</p></div>;
    if (!cardDetails) return null;

    return (
        <div onClick={() => router.back()} className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12 md:pt-16 px-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-gray-100 rounded-lg shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
                {isAddingChecklist && <ChecklistFormPopup cardId={params.cardId} boardId={params.boardId} onAdd={handleAddChecklist} onCancel={() => setIsAddingChecklist(false)} />}
                <button onClick={() => router.back()} className="absolute top-3 right-3 p-2 text-gray-600 hover:bg-gray-200 rounded-full z-10"><LuX size={20} /></button>
                <div className="py-6 px-4 md:py-8 md:px-6">
                    <SectionHeader icon={LuCreditCard} title={cardDetails.title}>
                        <p className="text-sm text-gray-500 mt-1">trong danh sách <span className="underline font-medium">{cardDetails.list?.title}</span></p>
                    </SectionHeader>

                    <div className="flex flex-col md:flex-row gap-6 mt-6">
                        <main className="w-full md:w-2/3 space-y-6">
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

                            {/* --- PHẦN RENDER CHECKLIST --- */}
                            {checklists.map(checklist => (
                                <ChecklistDisplay key={checklist.id} checklist={checklist} boardId={params.boardId} onUpdate={handleUpdateChecklist} onDelete={handleDeleteChecklist} />
                            ))}

                            <section>
                                <SectionHeader icon={LuListOrdered} title="Hoạt động" />
                            </section>
                        </main>

                        <aside className="w-full md:w-1/3 space-y-2">
                            <h4 className="text-xs font-bold text-gray-500">Thêm vào thẻ</h4>
                            <ActionButton icon={LuUser} text="Thành viên" />
                            <ActionButton icon={LuTag} text="Nhãn" />
                            <ActionButton icon={LuClock} text="Ngày" />
                            <ActionButton icon={LuPaperclip} text="Đính kèm" />
                            <ActionButton icon={LuCheck} text="Việc cần làm" onClick={() => setIsAddingChecklist(true)} />
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}