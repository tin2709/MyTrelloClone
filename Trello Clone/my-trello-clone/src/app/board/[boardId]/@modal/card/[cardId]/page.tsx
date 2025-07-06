'use client';

// React & Next.js Core
import React, { useState, useEffect, useCallback, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Supabase
import { createClient } from '@/lib/supabase/client';

// Server Actions
import { updateCardDescription, markCard } from '../../../card-actions';
import { deleteChecklist } from '../../../checklist-actions';
import { createChecklistItem, deleteChecklistItem, updateChecklistItemStatus } from '../../../checklist-item-actions';
import { deleteAttachment } from '../../../attachment-actions';

// Third-party Libraries & Styles
import DOMPurify from 'dompurify';
import 'react-day-picker/dist/style.css'; // Vẫn giữ lại vì DatesDisplay hoặc các component khác có thể cần

// Icons
import {
    LuX, LuCreditCard, LuAlignLeft, LuListOrdered, LuUser, LuTag,
    LuClock, LuPaperclip, LuCheck, LuTrash2, LuLink2,
    LuFile, LuImage, LuFilm, LuFileText
} from 'react-icons/lu';

// Local Components
import { DescriptionEditor } from '@/components/DescriptionEditor';
import { LabelsPopup } from '../components/labels-popup';

// =======================================================
// === CẬP NHẬT: IMPORT CÁC POPUP MỚI TỪ FILE RIÊNG ===
// =======================================================
import { DatesPopup } from '../components/dates-popup';
import { ChecklistFormPopup } from '../components/checklist-form-popup';
import { AttachmentPopup } from '../components/attachment-popup';
import { EditAttachmentPopup } from '../components/edit-attachment-popup';


// --- TYPE DEFINITIONS (Không đổi) ---
interface ChecklistItem { id: string; text: string; is_completed: boolean; position: number; checklist_id: string; }
interface Checklist { id: string; title: string; card_id: string; position: number; checklist_items: ChecklistItem[]; }
interface Label { id: string; name: string | null; color: string; board_id: string; }
interface CardDetails { id: string; title: string; description: string | null; started_at: string | null; dued_at: string | null; completed_at: string | null; list: { title: string } | null; }
interface Attachment { id: string; display_name: string; file_path: string; attachment_type: 'link' | 'upload'; created_at: string; }


// =======================================================================
// --- HELPER & UI COMPONENTS (Không đổi) ---
// =======================================================================
const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return { Icon: LuImage, text: 'ẢNH', color: 'text-green-600' };
    }
    if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) {
        return { Icon: LuFilm, text: 'VIDEO', color: 'text-purple-600' };
    }
    if (['doc', 'docx'].includes(extension)) {
        return { Icon: LuFileText, text: 'DOCX', color: 'text-blue-600' };
    }
    if (['pdf'].includes(extension)) {
        return { Icon: LuFileText, text: 'PDF', color: 'text-red-600' };
    }
    return { Icon: LuFile, text: extension.toUpperCase(), color: 'text-gray-600' };
};

const AttachmentItem = ({ attachment, onEdit, onDelete }: {
    attachment: Attachment,
    onEdit: (attachment: Attachment) => void,
    onDelete: (attachment: Attachment) => void
}) => {
    const isLink = attachment.attachment_type === 'link';
    const isYoutubeLink = isLink && (attachment.file_path.includes('youtube.com') || attachment.file_path.includes('youtu.be'));
    const fileInfo = !isLink ? getFileIcon(attachment.display_name) : null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const bucketName = 'attachments';
    const filePublicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${attachment.file_path}`;

    return (
        <div className="flex items-start gap-3 p-1 rounded-md hover:bg-gray-100/80 group w-full">
            <a
                href={isLink ? attachment.file_path : filePublicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-28 h-20 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0 text-center font-bold"
            >
                {isYoutubeLink ? (
                    <img src={`https://i.ytimg.com/vi/${new URL(attachment.file_path).searchParams.get('v')}/default.jpg`} alt="Youtube thumbnail" className="w-full h-full object-cover rounded-md" />
                ) : isLink ? (
                    <LuLink2 size={24} className="text-gray-600" />
                ) : fileInfo ? (
                    <div className={`flex flex-col items-center justify-center ${fileInfo.color}`}>
                        <fileInfo.Icon size={32} />
                        <span className="text-xs mt-1">{fileInfo.text}</span>
                    </div>
                ) : null}
            </a>
            <div className="flex-1 pt-1 overflow-hidden">
                <a
                    href={isLink ? attachment.file_path : filePublicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-gray-800 hover:underline break-words"
                    title={attachment.display_name}
                >
                    {attachment.display_name}
                </a>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>Đã thêm {new Date(attachment.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span onClick={() => onEdit(attachment)} className="cursor-pointer hover:underline font-medium">Sửa</span>
                    <span className="text-gray-300">|</span>
                    <span onClick={() => onDelete(attachment)} className="cursor-pointer hover:underline font-medium">Xóa</span>
                </div>
            </div>
        </div>
    );
};

const ActionButton = ({ icon: Icon, text, onClick }: {
    icon: React.ElementType,
    text: string,
    onClick?: () => void
}) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-1.5 rounded-sm
                   bg-gray-200/60 hover:bg-gray-200/90 text-gray-800
                   text-sm font-medium"
    >
        <Icon size={16} className="text-gray-600" />
        <span>{text}</span>
    </button>
);

const SectionHeader = ({ icon: Icon, title, children }: {
    icon: React.ElementType,
    title: string,
    children?: React.ReactNode
}) => (
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


// =======================================================================
// --- FEATURE-SPECIFIC COMPONENTS (Không đổi) ---
// =======================================================================

const DatesDisplay = ({ card, boardId, onToggleDatesPopup }: { card: CardDetails, boardId: string, onToggleDatesPopup: () => void }) => {
    const [isPending, startTransition] = useTransition();

    const getDueDateStatus = () => {
        if (card.completed_at) return { text: 'Hoàn thành', color: 'bg-green-600 text-white' };
        if (!card.dued_at) return null;
        const dueDate = new Date(card.dued_at);
        const now = new Date();
        const oneDayInMs = 24 * 60 * 60 * 1000;

        if (dueDate < now) return { text: 'Quá hạn', color: 'bg-red-500 text-white' };
        if (dueDate.getTime() - now.getTime() <= oneDayInMs) return { text: 'Sắp hết hạn', color: 'bg-yellow-500 text-black' };
        return null;
    };

    const handleToggleComplete = () => {
        startTransition(() => {
            // Chỉ cần gọi Server Action, không cần await.
            // Nó sẽ chạy ở background, và isPending sẽ là true.
            markCard(card.id, boardId, card.title, card.completed_at);
        });
    };
    const formatDate = (isoString: string | null) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        return `${time} ${date.getDate()} thg ${date.getMonth() + 1}`;
    };

    const status = getDueDateStatus();
    if (!card.started_at && !card.dued_at) return null;

    return (
        <div>
            <h4 className="text-xs font-bold text-gray-500 mb-2">NGÀY HẾT HẠN</h4>
            <div className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded-sm flex-shrink-0" checked={!!card.completed_at} onChange={handleToggleComplete} disabled={isPending} />
                <button onClick={onToggleDatesPopup} className={`flex items-center gap-2 text-sm font-medium p-2 rounded-sm w-fit ${card.completed_at ? 'line-through bg-gray-300' : 'bg-gray-200/80 hover:bg-gray-200'}`}>
                    {card.started_at && <span>{formatDate(card.started_at)} -</span>}
                    {card.dued_at && <span>{formatDate(card.dued_at)}</span>}
                    {status && (<span className={`px-2 py-0.5 rounded-sm text-xs font-semibold ${status.color}`}>{status.text}</span>)}
                </button>
            </div>
        </div>
    );
};

const ChecklistItemForm = ({ checklistId, boardId, onAddItem, onCancel }: { checklistId: string, boardId: string, onAddItem: (newItem: ChecklistItem) => void, onCancel: () => void }) => {
    const formRef = React.useRef<HTMLFormElement>(null);
    const [state, formAction, isPending] = useActionState(createChecklistItem, { success: false });

    useEffect(() => {
        if (state.success && state.item) {
            onAddItem(state.item);
            formRef.current?.reset();
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

const ChecklistDisplay = ({ checklist, boardId, onUpdate, onDelete }: { checklist: Checklist, boardId: string, onUpdate: (updatedChecklist: Checklist) => void, onDelete: (id: string) => void }) => {
    const [isAddingItem, setIsAddingItem] = useState(false);
    const items = checklist.checklist_items || [];
    const totalItems = items.length;
    const completedItems = items.filter(item => item.is_completed).length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const handleDeleteChecklist = async () => {
        if (window.confirm(`Bạn có chắc muốn xóa danh sách "${checklist.title}"?`)) {
            const result = await deleteChecklist(checklist.id, boardId);
            if (result.success) onDelete(checklist.id);
            else alert(`Lỗi: ${result.error}`);
        }
    };

    const handleAddItem = (newItem: ChecklistItem) => {
        onUpdate({ ...checklist, checklist_items: [...items, newItem].sort((a,b) => a.position - b.position) });
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
                        <button onClick={handleDeleteChecklist} className="text-xs font-medium bg-gray-200/80 hover:bg-gray-200 px-3 py-1 rounded-sm">Xóa</button>
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


// =======================================================================
// --- MAIN MODAL COMPONENT (Không đổi logic, chỉ cập nhật cách render popup) ---
// =======================================================================

export default function CardModal({ params }: { params: { boardId: string, cardId: string }}) {
    const router = useRouter();
    const supabase = createClient();
    const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    // State cho các Pop-up (Không đổi)
    const [isAddingChecklist, setIsAddingChecklist] = useState(false);
    const [isLabelsPopupOpen, setIsLabelsPopupOpen] = useState(false);
    const [isDatesPopupOpen, setIsDatesPopupOpen] = useState(false);
    const [allBoardLabels, setAllBoardLabels] = useState<Label[]>([]);
    const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isAttachmentPopupOpen, setIsAttachmentPopupOpen] = useState(false);
    const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);

    // Toàn bộ các hàm xử lý logic (fetchCardData, handle... ) đều giữ nguyên
    const fetchCardData = useCallback(async () => {
        const { data: cardData, error: cardError } = await supabase.from('Cards').select(`id, title, description, started_at, dued_at, completed_at, list:Lists(title)`).eq('id', params.cardId).single();
        if (cardError) { console.error("Lỗi khi tải thẻ:", cardError.message); router.back(); return; }
        setCardDetails(cardData as CardDetails);

        const { data: checklistData, error: checklistError } = await supabase.from('Checklists').select(`*, checklist_items:Checklist_items(*)`).eq('card_id', params.cardId).order('position', { ascending: true });
        if(checklistError) console.error("Lỗi khi tải checklist:", checklistError.message); else setChecklists(checklistData as unknown as Checklist[]);

        const { data: attachmentsData, error: attachmentsError } = await supabase.from('Attachments').select('*').eq('card_id', params.cardId).order('created_at', { ascending: true });
        if (attachmentsError) console.error("Lỗi khi tải attachments:", attachmentsError.message); else setAttachments(attachmentsData as Attachment[]);

        const { data: boardLabelsData, error: boardLabelsError } = await supabase.from('Labels').select('*').eq('board_id', params.boardId).order('name', { ascending: true });
        if (boardLabelsError) console.error("Lỗi khi tải các nhãn của board:", boardLabelsError.message); else setAllBoardLabels(boardLabelsData as Label[]);

        const { data: attachedLabelsData, error: attachedLabelsError } = await supabase.from('Card_labels').select('Labels(*)').eq('card_id', params.cardId);
        if (attachedLabelsError) console.error("Lỗi khi tải các nhãn đã gắn:", attachedLabelsError.message); else {
            const extractedLabels = attachedLabelsData.map(item => item.Labels) as Label[];
            setSelectedLabels(extractedLabels);
        }
    }, [params.cardId, params.boardId, router, supabase]);

    const handleAttachmentSaveSuccess = useCallback(() => fetchCardData(), [fetchCardData]);
    const handleLabelsChange = useCallback((newLabels: Label[]) => setSelectedLabels(newLabels), []);
    const handleOpenEditAttachment = (attachment: Attachment) => setEditingAttachment(attachment);
    const handleCloseEditAttachment = () => setEditingAttachment(null);

    const handleDeleteAttachment = async (attachmentToDelete: Attachment) => {
        if (!window.confirm(`Bạn có chắc muốn xóa đính kèm "${attachmentToDelete.display_name}"?`)) return;
        setAttachments(prev => prev.filter(att => att.id !== attachmentToDelete.id));
        const formData = new FormData();
        formData.append('attachmentId', attachmentToDelete.id);
        formData.append('boardId', params.boardId);
        formData.append('cardTitle', cardDetails?.title || '');
        formData.append('filePath', attachmentToDelete.file_path);
        formData.append('displayName', attachmentToDelete.display_name);
        const result = await deleteAttachment({ success: false }, formData);
        if (result.error) { alert(`Lỗi: ${result.error}`); fetchCardData(); }
    };

    useEffect(() => { setLoading(true); fetchCardData().finally(() => setLoading(false)); }, [fetchCardData]);

    const handleDatesUpdate = useCallback((updates: Partial<Pick<CardDetails, 'started_at' | 'dued_at'>>) => {
        setCardDetails(prevDetails => prevDetails ? { ...prevDetails, ...updates } : null);
    }, []);

    const handleSaveDescription = useCallback(async (htmlContent: string) => {
        if (!params.cardId || !params.boardId) return;
        const formData = new FormData();
        formData.append('cardId', params.cardId);
        formData.append('boardId', params.boardId);
        formData.append('description', htmlContent);
        const result = await updateCardDescription({ success: false }, formData);
        if (result.success) { setCardDetails(prev => prev ? { ...prev, description: htmlContent } : null); setIsEditingDescription(false); }
        else { alert(`Lỗi: ${result.error}`); }
    }, [params.cardId, params.boardId]);

    const handleAddChecklist = (newChecklist: Checklist) => setChecklists(prev => [...prev, newChecklist]);
    const handleDeleteChecklist = (checklistId: string) => setChecklists(prev => prev.filter(c => c.id !== checklistId));
    const handleUpdateChecklist = (updatedChecklist: Checklist) => setChecklists(prev => prev.map(cl => cl.id === updatedChecklist.id ? updatedChecklist : cl));

    if (loading) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"><p className="text-white text-lg">Đang tải...</p></div>;
    if (!cardDetails) return null;

    return (
        <div onClick={() => router.back()} className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12 md:pt-16 px-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-gray-100 rounded-lg shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">

                {/* ======================================================== */}
                {/* === CẬP NHẬT: RENDER CÁC POPUP TỪ COMPONENT ĐÃ IMPORT === */}
                {/* ======================================================== */}
                {isAddingChecklist && <ChecklistFormPopup cardId={params.cardId} boardId={params.boardId} onAdd={handleAddChecklist} onCancel={() => setIsAddingChecklist(false)} />}

                {isLabelsPopupOpen && (
                    <LabelsPopup
                        card={cardDetails}
                        boardId={params.boardId}
                        allBoardLabels={allBoardLabels}
                        initialSelectedLabels={selectedLabels}
                        onLabelsChange={handleLabelsChange}
                        onClose={() => setIsLabelsPopupOpen(false)}
                        onDataRefresh={fetchCardData}
                    />
                )}

                {isDatesPopupOpen && <DatesPopup card={cardDetails} boardId={params.boardId} onClose={() => setIsDatesPopupOpen(false)} onSaveSuccess={handleDatesUpdate} />}

                {isAttachmentPopupOpen && <AttachmentPopup card={cardDetails} boardId={params.boardId} onClose={() => setIsAttachmentPopupOpen(false)} onSaveSuccess={handleAttachmentSaveSuccess} />}

                {editingAttachment && (
                    <EditAttachmentPopup
                        attachment={editingAttachment}
                        boardId={params.boardId}
                        onClose={handleCloseEditAttachment}
                        onSaveSuccess={handleAttachmentSaveSuccess}
                    />
                )}
                {/* ======================================================== */}

                <button onClick={() => router.back()} className="absolute top-3 right-3 p-2 text-gray-600 hover:bg-gray-200 rounded-full z-10"><LuX size={20} /></button>

                {/* Toàn bộ phần JSX hiển thị nội dung modal bên dưới được giữ nguyên */}
                <div className="py-6 px-4 md:py-8 md:px-6">
                    <SectionHeader icon={LuCreditCard} title={cardDetails.title}>
                        <p className="text-sm text-gray-500 mt-1">trong danh sách <span className="underline font-medium">{cardDetails.list?.title}</span></p>
                    </SectionHeader>

                    <div className="flex flex-col md:flex-row gap-6 mt-6">
                        <main className="w-full md:w-2/3 space-y-6">
                            <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                                <DatesDisplay card={cardDetails} boardId={params.boardId} onToggleDatesPopup={() => setIsDatesPopupOpen(true)} />
                                {selectedLabels.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 mb-2">NHÃN</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedLabels.map(label => (
                                                <div key={label.id} style={{ backgroundColor: label.color }} className="rounded-sm px-3 py-1 text-white text-sm font-bold h-8 flex items-center">
                                                    {label.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
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
                            {attachments.length > 0 && (
                                <section>
                                    <SectionHeader icon={LuPaperclip} title="Các tập tin đính kèm" />
                                    <div className="pl-10 mt-2 space-y-2">
                                        {attachments.map(att => (
                                            <AttachmentItem
                                                key={att.id}
                                                attachment={att}
                                                onEdit={handleOpenEditAttachment}
                                                onDelete={handleDeleteAttachment}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
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
                            <ActionButton icon={LuTag} text="Nhãn" onClick={() => setIsLabelsPopupOpen(true)} />
                            <ActionButton icon={LuClock} text="Ngày" onClick={() => setIsDatesPopupOpen(true)} />
                            <ActionButton icon={LuPaperclip} text="Đính kèm" onClick={() => setIsAttachmentPopupOpen(true)} />
                            <ActionButton icon={LuCheck} text="Việc cần làm" onClick={() => setIsAddingChecklist(true)} />
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}