'use client';

// React & Next.js Core
import React, { useState, useEffect, useCallback, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Supabase
import { createClient } from '@/lib/supabase/client';

// Server Actions
import {
    updateCardDescription,
    updateCardDates,
    markCard
} from '../../../card-actions';
import {
    createChecklist,
    deleteChecklist
} from '../../../checklist-actions';
import {
    createChecklistItem,
    deleteChecklistItem,
    updateChecklistItemStatus
} from '../../../checklist-item-actions';
import { createAttachment,updateAttachment,
    deleteAttachment  } from '../../../attachment-actions';

// Third-party Libraries & Styles
import { DayPicker, DateRange } from 'react-day-picker';
import { vi } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import DOMPurify from 'dompurify';

// Icons
import {
    LuX, LuCreditCard, LuAlignLeft, LuListOrdered, LuUser, LuTag,
    LuClock, LuPaperclip, LuCheck, LuTrash2, LuPencil, LuLink2
} from 'react-icons/lu';

// Local Components (nếu có)
import { DescriptionEditor } from '@/components/DescriptionEditor';

// --- TYPE DEFINITIONS ---
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

interface Label {
    id: string;
    name: string | null;
    color: string;
}

interface CardDetails {
    id: string;
    title: string;
    description: string | null;
    started_at: string | null;
    dued_at: string | null;
    completed_at: string | null;
    list: { title: string } | null;
}
interface Attachment {
    id: string;
    display_name: string;
    file_path: string; // Đây là URL của link
    attachment_type: 'link' | 'upload';
    created_at: string;
}
// =======================================================================
// --- HELPER & UI COMPONENTS ---
// =======================================================================
const AttachmentItem = ({ attachment, onEdit, onDelete }: {
    attachment: Attachment,
    onEdit: (attachment: Attachment) => void,
    onDelete: (attachment: Attachment) => void
}) => {
    const isYoutubeLink = attachment.file_path.includes('youtube.com') || attachment.file_path.includes('youtu.be');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Xử lý đóng menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const handleEdit = () => {
        onEdit(attachment);
        setIsMenuOpen(false);
    };

    const handleDelete = () => {
        onDelete(attachment);
        setIsMenuOpen(false);
    };

    return (
        <div className="flex items-start gap-3 p-1 rounded-md hover:bg-gray-200/60 group">
            <a href={attachment.file_path} target="_blank" rel="noopener noreferrer" className="w-28 h-20 bg-gray-300 rounded-sm flex items-center justify-center flex-shrink-0">
                {isYoutubeLink ? (
                    <img src={`https://i.ytimg.com/vi/${new URL(attachment.file_path).searchParams.get('v')}/default.jpg`} alt="Youtube thumbnail" className="w-full h-full object-cover rounded-sm" />
                ) : (
                    <LuLink2 size={24} className="text-gray-600" />
                )}
            </a>
            <div className="flex-1 pt-1">
                <a
                    href={attachment.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-gray-800 hover:underline"
                >
                    {attachment.display_name}
                </a>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{new Date(attachment.created_at).toLocaleDateString('vi-VN')}</span>
                    <span>-</span>
                    <span onClick={handleEdit} className="cursor-pointer hover:underline font-medium">Sửa</span>
                    <span>-</span>
                    <span onClick={handleDelete} className="cursor-pointer hover:underline font-medium">Xóa</span>
                </div>
            </div>
            <div ref={menuRef} className="relative">
                <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1.5 rounded-md text-gray-600 hover:bg-gray-300/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    <LuPencil size={16} />
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg w-60 z-10 border p-2">
                        <img src={`https://i.ytimg.com/vi/${new URL(attachment.file_path).searchParams.get('v')}/mqdefault.jpg`} alt="Preview" className="w-full h-auto object-cover rounded-md mb-2" />
                        <p className="font-bold text-sm mb-2">{attachment.display_name}</p>
                        <button onClick={handleEdit} className="w-full text-left text-sm px-3 py-1.5 hover:bg-gray-100 rounded-md">Sửa tệp đính kèm</button>
                        <button onClick={handleDelete} className="w-full text-left text-sm px-3 py-1.5 hover:bg-gray-100 rounded-md text-red-600">Xóa tệp đính kèm</button>
                    </div>
                )}
            </div>
        </div>
    );
};
// Component cho popup đính kèm
const AttachmentPopup = ({ card, boardId, onClose, onSaveSuccess }: {
    card: CardDetails;
    boardId: string;
    onClose: () => void;
    onSaveSuccess: () => void;
}) => {
    const [state, formAction] = useActionState(createAttachment, { success: false });
    const [linkUrl, setLinkUrl] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    // Xử lý khi dán link Youtube
    useEffect(() => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (!youtubeRegex.test(linkUrl)) return;

        const fetchTitle = async () => {
            setIsFetchingTitle(true);
            try {
                // Sử dụng oEmbed của Youtube để lấy thông tin video một cách công khai
                const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(linkUrl)}&format=json`);
                if (!response.ok) throw new Error('Không tìm thấy video');
                const data = await response.json();
                if (data.title) {
                    setDisplayName(data.title);
                }
            } catch (error) {
                console.warn("Không thể lấy tiêu đề Youtube:", error);
            } finally {
                setIsFetchingTitle(false);
            }
        };

        const debounce = setTimeout(fetchTitle, 500); // Chờ 500ms sau khi người dùng ngừng gõ
        return () => clearTimeout(debounce);
    }, [linkUrl]);

    // Xử lý khi form được gửi thành công
    useEffect(() => {
        if (state.success) {
            onSaveSuccess(); // Gọi callback để tải lại dữ liệu ở component cha
            onClose();
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
        }
    }, [state, onClose, onSaveSuccess]);

    return (
        <div className="absolute inset-0 bg-black/10 z-20 flex items-center justify-center">
            <div className="bg-white rounded-md p-0 shadow-lg w-80">
                <div className="relative flex items-center justify-center border-b p-2">
                    <span className="text-sm font-medium text-gray-700">Đính kèm</span>
                    <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><LuX size={16} /></button>
                </div>
                <div className="p-4 space-y-4">
                    <button className="w-full text-center py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium">Chọn tệp</button>

                    <form action={formAction} className="space-y-3">
                        <input type="hidden" name="cardId" value={card.id} />
                        <input type="hidden" name="boardId" value={boardId} />
                        <input type="hidden" name="cardTitle" value={card.title} />

                        <div>
                            <label className="text-xs font-bold text-gray-500">Tìm kiếm hoặc dán liên kết</label>
                            <input
                                name="linkUrl"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="Dán liên kết bất kỳ tại đây..."
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                                <span>Văn bản hiển thị (không bắt buộc)</span>
                                {isFetchingTitle && <span className="text-blue-500 text-xs">(Đang lấy tiêu đề...)</span>}
                            </label>
                            <input
                                name="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Văn bản cần hiển thị"
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                        </div>

                        <button type="submit" disabled={!linkUrl} className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                            Đính kèm
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
const EditAttachmentPopup = ({ attachment, boardId, onClose, onSaveSuccess }: {
    attachment: Attachment;
    boardId: string;
    onClose: () => void;
    onSaveSuccess: () => void;
}) => {
    const [state, formAction] = useActionState(updateAttachment, { success: false });
    const [linkUrl, setLinkUrl] = useState(attachment.file_path);
    const [displayName, setDisplayName] = useState(attachment.display_name);

    useEffect(() => {
        if (state.success) {
            onSaveSuccess();
            onClose();
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
        }
    }, [state, onClose, onSaveSuccess]);

    return (
        <div className="absolute inset-0 bg-black/10 z-30 flex items-center justify-center">
            <div className="bg-white rounded-md p-0 shadow-lg w-80">
                <div className="relative flex items-center justify-between border-b p-2">
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><LuX size={16} /></button>
                    <span className="text-sm font-medium text-gray-700">Sửa tệp đính kèm</span>
                    <div className="w-7"></div>
                </div>
                <div className="p-4">
                    <form action={formAction} className="space-y-3">
                        <input type="hidden" name="attachmentId" value={attachment.id} />
                        <input type="hidden" name="boardId" value={boardId} />
                        <input type="hidden" name="oldDisplayName" value={attachment.display_name} />

                        <div>
                            <label className="text-xs font-bold text-gray-500">Tìm kiếm hoặc dán liên kết</label>
                            <input
                                name="newLinkUrl"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500">Văn bản hiển thị</label>
                            <input
                                name="newDisplayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                        </div>

                        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Lưu
                        </button>
                    </form>
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
// --- FEATURE-SPECIFIC COMPONENTS ---
// =======================================================================

// --- 1. DATES COMPONENTS ---

const DatesDisplay = ({ card, boardId, onToggleDatesPopup }: {
    card: CardDetails,
    boardId: string,
    onToggleDatesPopup: () => void
}) => {
    const [isPending, startTransition] = useTransition();

    const getDueDateStatus = () => {
        if (card.completed_at) {
            return { text: 'Hoàn thành', color: 'bg-green-600 text-white' };
        }
        if (!card.dued_at) {
            return null;
        }
        const dueDate = new Date(card.dued_at);
        const now = new Date();
        const oneDayInMs = 24 * 60 * 60 * 1000;

        if (dueDate < now) {
            return { text: 'Quá hạn', color: 'bg-red-500 text-white' };
        }
        if (dueDate.getTime() - now.getTime() <= oneDayInMs) {
            return { text: 'Sắp hết hạn', color: 'bg-yellow-500 text-black' };
        }
        return null;
    };

    const handleToggleComplete = () => {
        startTransition(async () => {
            await markCard(card.id, boardId, card.title, card.completed_at);
        });
    };

    const formatDate = (isoString: string | null) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        return `${time} ${date.getDate()} thg ${date.getMonth() + 1}`;
    };

    const status = getDueDateStatus();

    if (!card.started_at && !card.dued_at) {
        return null;
    }

    return (
        <div>
            <h4 className="text-xs font-bold text-gray-500 mb-2">NGÀY HẾT HẠN</h4>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    checked={!!card.completed_at}
                    onChange={handleToggleComplete}
                    disabled={isPending}
                />
                <button
                    onClick={onToggleDatesPopup}
                    className={`flex items-center gap-2 text-sm font-medium p-2 rounded-sm w-fit
                    ${card.completed_at ? 'line-through bg-gray-300' : 'bg-gray-200/80 hover:bg-gray-200'}`}
                >
                    {card.started_at && <span>{formatDate(card.started_at)} -</span>}
                    {card.dued_at && <span>{formatDate(card.dued_at)}</span>}
                    {status && (
                        <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold ${status.color}`}>
                            {status.text}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

const DatesPopup = ({ card, boardId, onClose, onSaveSuccess}: {
    card: CardDetails,
    boardId: string,
    onClose: () => void,
    onSaveSuccess: (updates: Partial<Pick<CardDetails, 'started_at' | 'dued_at'>>) => void
}) => {
    const [state, formAction] = useActionState(updateCardDates, { success: false });

    const initialRange: DateRange | undefined = {
        from: card.started_at ? new Date(card.started_at) : undefined,
        to: card.dued_at ? new Date(card.dued_at) : undefined,
    };

    const [range, setRange] = useState<DateRange | undefined>(initialRange);
    const [startDateEnabled, setStartDateEnabled] = useState(!!card.started_at);
    const [dueDateEnabled, setDueDateEnabled] = useState(!!card.dued_at);

    const toTimeInput = (iso: string | null) => iso ? new Date(iso).toTimeString().slice(0, 5) : '12:00';
    const [dueTime, setDueTime] = useState(toTimeInput(card.dued_at));

    const formatDateForInput = (date: Date | undefined) => {
        if (!date) return '';
        return date.toLocaleDateString('vi-VN'); // Format as DD/MM/YYYY
    };

    // ... và thay thế bằng useEffect này
    useEffect(() => {
        if (state.success) {
            // Tính toán các giá trị ISO string từ state của popup
            const newStartedAt = startDateEnabled && range?.from
                ? range.from.toISOString()
                : null;

            const effectiveDueDate = range?.to || range?.from;
            const newDuedAt = dueDateEnabled && effectiveDueDate
                ? combineDateAndTime(effectiveDueDate, dueTime).toISOString()
                : null;

            // Gọi callback onSaveSuccess với dữ liệu mới
            onSaveSuccess({
                started_at: newStartedAt,
                dued_at: newDuedAt,
            });

            onClose(); // Đóng popup
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
        }
    }, [
        state,
        onClose,
        onSaveSuccess,
        range,
        startDateEnabled,
        dueDateEnabled,
        dueTime
    ]);

    const combineDateAndTime = (date: Date, time: string): Date => {
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('cardId', card.id);
        formData.append('boardId', boardId);
        formData.append('cardTitle', card.title);

        const startISO = startDateEnabled && range?.from
            ? range.from.toISOString()
            : '';

        // If there's a range, `to` might be undefined, so use `from` as fallback
        const effectiveDueDate = range?.to || range?.from;
        const dueISO = dueDateEnabled && effectiveDueDate
            ? combineDateAndTime(effectiveDueDate, dueTime).toISOString()
            : '';

        formData.append('started_at', startISO);
        formData.append('dued_at', dueISO);
        formAction(formData);
    };

    const handleRemove = () => {
        const formData = new FormData();
        formData.append('cardId', card.id);
        formData.append('boardId', boardId);
        formData.append('cardTitle', card.title);
        formData.append('started_at', '');
        formData.append('dued_at', '');
        formAction(formData);
    };

    return (
        <div className="absolute inset-0 bg-black/10 z-20 flex items-start justify-end pt-24 pr-4">
            <div className="bg-white rounded-md p-0 shadow-lg w-[304px]" onClick={e => e.stopPropagation()}>
                <div className="relative flex items-center justify-center border-b p-2">
                    <span className="text-sm font-medium text-gray-700">Ngày</span>
                    <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><LuX size={16} /></button>
                </div>

                <div className="p-3">
                    <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={setRange}
                        locale={vi}
                        showOutsideDays
                    />

                    <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                        <div>
                            <label className="text-xs font-bold text-gray-500">Ngày bắt đầu</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={startDateEnabled}
                                    onChange={(e) => setStartDateEnabled(e.target.checked)}
                                />
                                <input
                                    type="text"
                                    readOnly
                                    value={formatDateForInput(range?.from)}
                                    className="w-full px-2 py-1.5 border rounded-md text-sm bg-gray-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500">Ngày hết hạn</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={dueDateEnabled}
                                    onChange={(e) => setDueDateEnabled(e.target.checked)}
                                />
                                <input
                                    type="text"
                                    readOnly
                                    value={formatDateForInput(range?.to || range?.from)}
                                    className="w-full px-2 py-1.5 border rounded-md text-sm bg-gray-100"
                                />
                                <input
                                    type="time"
                                    value={dueTime}
                                    onChange={e => setDueTime(e.target.value)}
                                    className="px-2 py-1.5 border rounded-md text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="reminder" className="text-xs font-bold text-gray-500">Thiết lập Nhắc nhở</label>
                            <select id="reminder" className="w-full mt-1 px-2 py-1.5 border rounded-md text-sm bg-gray-50">
                                <option>Không có</option>
                                <option>Khi hết hạn</option>
                                <option>1 ngày trước</option>
                                <option>2 ngày trước</option>
                            </select>
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md font-medium text-sm hover:bg-blue-700">
                            Lưu
                        </button>
                        <button type="button" onClick={handleRemove} className="w-full bg-gray-200 text-gray-800 py-2 rounded-md font-medium text-sm hover:bg-gray-300">
                            Gỡ bỏ
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- 2. LABELS COMPONENTS ---

const LabelsPopup = ({ selectedLabels, onLabelToggle, onClose }: {
    selectedLabels: Label[];
    onLabelToggle: (label: Label) => void;
    onClose: () => void;
}) => {
    const allMockLabels: Label[] = [
        { id: '1', name: 'Frontend', color: '#61bd4f' },
        { id: '2', name: 'Backend', color: '#f2d600' },
        { id: '3', name: 'Bug', color: '#ff9f1a' },
        { id: '4', name: 'Urgent', color: '#eb5a46' },
        { id: '5', name: 'UI/UX', color: '#c377e0' },
        { id: '6', name: 'Documentation', color: '#0079bf' },
    ];

    const selectedLabelIds = new Set(selectedLabels.map(l => l.id));

    return (
        <div className="absolute inset-0 bg-black/10 z-20 flex items-start justify-end pt-24">
            <div className="bg-white rounded-md p-0 shadow-lg w-72" onClick={e => e.stopPropagation()}>
                <div className="relative flex items-center justify-center border-b p-2">
                    <span className="text-sm font-medium text-gray-700">Nhãn</span>
                    <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><LuX size={16} /></button>
                </div>
                <div className="p-3 space-y-2">
                    <input type="text" placeholder="Tìm nhãn..." className="w-full px-2 py-1.5 border rounded-md text-sm" />
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-500">Nhãn</h4>
                        {allMockLabels.map(label => (
                            <div key={label.id} className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded"
                                    checked={selectedLabelIds.has(label.id)}
                                    onChange={() => onLabelToggle(label)}
                                />
                                <div className="flex-grow flex items-center gap-2 cursor-pointer" onClick={() => onLabelToggle(label)}>
                                    <div
                                        className="w-full h-8 rounded-sm flex items-center px-3"
                                        style={{ backgroundColor: label.color }}
                                    >
                                        <span className="text-white font-bold text-sm">{label.name}</span>
                                    </div>
                                </div>
                                <button className="p-1 text-gray-500 hover:text-gray-800"><LuPencil size={14} /></button>
                            </div>
                        ))}
                    </div>
                    <button className="w-full text-sm py-2 bg-gray-100 hover:bg-gray-200 rounded-md">Tạo nhãn mới</button>
                </div>
            </div>
        </div>
    );
};


// --- 3. CHECKLIST COMPONENTS ---

const ChecklistFormPopup = ({ cardId, boardId, onAdd, onCancel }: {
    cardId: string, boardId: string, onAdd: (newChecklist: Checklist) => void, onCancel: () => void
}) => {
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

    return (
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

const ChecklistItemForm = ({ checklistId, boardId, onAddItem, onCancel }: {
    checklistId: string, boardId: string, onAddItem: (newItem: ChecklistItem) => void, onCancel: () => void
}) => {
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

const ChecklistItemDisplay = ({ item, onUpdateStatus, onDeleteItem }: {
    item: ChecklistItem, onUpdateStatus: (itemId: string, isCompleted: boolean) => void, onDeleteItem: (itemId: string) => void
}) => {
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

const ChecklistDisplay = ({ checklist, boardId, onUpdate, onDelete }: {
    checklist: Checklist, boardId: string, onUpdate: (updatedChecklist: Checklist) => void, onDelete: (id: string) => void
}) => {
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
// --- MAIN MODAL COMPONENT ---
// =======================================================================

export default function CardModal({ params }: { params: { boardId: string, cardId: string }}) {
    const router = useRouter();
    const supabase = createClient();
    const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    // State cho các Pop-up
    const [isAddingChecklist, setIsAddingChecklist] = useState(false);
    const [isLabelsPopupOpen, setIsLabelsPopupOpen] = useState(false);
    const [isDatesPopupOpen, setIsDatesPopupOpen] = useState(false);

    const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]); // Thêm state cho attachments
    const [isAttachmentPopupOpen, setIsAttachmentPopupOpen] = useState(false); // Thêm state cho popup
    const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);

    const handleLabelToggle = (labelToToggle: Label) => {
        setSelectedLabels(prevLabels => {
            const isSelected = prevLabels.some(label => label.id === labelToToggle.id);
            if (isSelected) {
                return prevLabels.filter(label => label.id !== labelToToggle.id);
            } else {
                return [...prevLabels, labelToToggle];
            }
        });
    };

    const fetchCardData = useCallback(async () => {
        const { data: cardData, error: cardError } = await supabase
            .from('Cards')
            .select(`id, title, description, started_at, dued_at, completed_at, list:Lists(title)`)
            .eq('id', params.cardId)
            .single();

        if (cardError) {
            console.error("Lỗi khi tải thẻ:", cardError.message);
            router.back();
            return;
        }
        setCardDetails(cardData as CardDetails);

        const { data: checklistData, error: checklistError } = await supabase
            .from('Checklists')
            .select(`*, checklist_items:Checklist_items(*)`)
            .eq('card_id', params.cardId)
            .order('position', { ascending: true });

        if(checklistError) console.error("Lỗi khi tải checklist:", checklistError.message);
        else setChecklists(checklistData as unknown as Checklist[]);
        const { data: attachmentsData, error: attachmentsError } = await supabase
            .from('Attachments')
            .select('*')
            .eq('card_id', params.cardId)
            .order('created_at', { ascending: true });

        if (attachmentsError) {
            console.error("Lỗi khi tải attachments:", attachmentsError.message);
        } else {
            setAttachments(attachmentsData as Attachment[]);
        }
    }, [params.cardId, router, supabase]);
    const handleAttachmentSaveSuccess = useCallback(() => {
        // Tải lại toàn bộ dữ liệu của thẻ để cập nhật danh sách đính kèm
        fetchCardData();
    }, [fetchCardData]);
    const handleOpenEditAttachment = (attachment: Attachment) => {
        setEditingAttachment(attachment);
    };

    const handleCloseEditAttachment = () => {
        setEditingAttachment(null);
    };

    const handleDeleteAttachment = async (attachmentToDelete: Attachment) => {
        if (!window.confirm(`Bạn có chắc muốn xóa đính kèm "${attachmentToDelete.display_name}"?`)) {
            return;
        }

        // Cập nhật UI ngay lập tức để có trải nghiệm tốt hơn
        setAttachments(prev => prev.filter(att => att.id !== attachmentToDelete.id));

        const formData = new FormData();
        formData.append('attachmentId', attachmentToDelete.id);
        formData.append('boardId', params.boardId);
        formData.append('cardTitle', cardDetails?.title || ''); // Lấy cardTitle từ state
        formData.append('filePath', attachmentToDelete.file_path); // Cần cho việc xóa file (nếu là upload)
        formData.append('displayName', attachmentToDelete.display_name);

        const result = await deleteAttachment({ success: false }, formData);

        if (result.error) {
            alert(`Lỗi: ${result.error}`);
            // Nếu có lỗi, tải lại dữ liệu từ server để khôi phục lại trạng thái cũ
            fetchCardData();
        }
    };
    useEffect(() => {
        setLoading(true);
        fetchCardData().finally(() => setLoading(false));
    }, [fetchCardData]);

    // Thêm hàm mới này
    const handleDatesUpdate = useCallback((updates: Partial<Pick<CardDetails, 'started_at' | 'dued_at'>>) => {
        setCardDetails(prevDetails => {
            // Kiểm tra nếu state trước đó tồn tại
            if (!prevDetails) return null;
            // Trả về state mới bằng cách gộp state cũ với các giá trị ngày tháng mới
            return { ...prevDetails, ...updates };
        });
    }, []); // Không cần dependencies vì setCardDetails là ổn định

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

    const handleAddChecklist = (newChecklist: Checklist) => setChecklists(prev => [...prev, newChecklist]);
    const handleDeleteChecklist = (checklistId: string) => setChecklists(prev => prev.filter(c => c.id !== checklistId));
    const handleUpdateChecklist = (updatedChecklist: Checklist) => setChecklists(prev => prev.map(cl => cl.id === updatedChecklist.id ? updatedChecklist : cl));

    if (loading) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"><p className="text-white text-lg">Đang tải...</p></div>;
    if (!cardDetails) return null;

    return (
        <div onClick={() => router.back()} className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12 md:pt-16 px-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-gray-100 rounded-lg shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">

                {isAddingChecklist && <ChecklistFormPopup cardId={params.cardId} boardId={params.boardId} onAdd={handleAddChecklist} onCancel={() => setIsAddingChecklist(false)} />}
                {isLabelsPopupOpen && <LabelsPopup selectedLabels={selectedLabels} onLabelToggle={handleLabelToggle} onClose={() => setIsLabelsPopupOpen(false)} />}
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
                <button onClick={() => router.back()} className="absolute top-3 right-3 p-2 text-gray-600 hover:bg-gray-200 rounded-full z-10"><LuX size={20} /></button>
                <div className="py-6 px-4 md:py-8 md:px-6">
                    <SectionHeader icon={LuCreditCard} title={cardDetails.title}>
                        <p className="text-sm text-gray-500 mt-1">trong danh sách <span className="underline font-medium">{cardDetails.list?.title}</span></p>
                    </SectionHeader>

                    <div className="flex flex-col md:flex-row gap-6 mt-6">
                        <main className="w-full md:w-2/3 space-y-6">
                            <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                                <DatesDisplay card={cardDetails} boardId={params.boardId} onToggleDatesPopup={() => setIsDatesPopupOpen(true)} />
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
                                                {/* CẬP NHẬT props cho AttachmentItem */}
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