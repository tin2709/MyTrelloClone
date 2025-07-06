// @/app/board/[boardId]/components/KanbanCard.tsx

'use client';

import Link from 'next/link';
import {useState, useMemo, useTransition, useOptimistic} from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { markCard } from '@/app/board/[boardId]/card-actions';

// --- BẮT ĐẦU THAY ĐỔI ---
import {
    Pencil, AlignLeft, Paperclip, CheckSquare, Clock,
    CheckCircle, Circle, Trash2
} from 'lucide-react';
import type { Card } from '../types';



const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
        {text}
    </div>
);

export const KanbanCard = ({ boardId, card }: { boardId: string; card: Card }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [optimisticCard, setOptimisticCard] = useOptimistic(
        card,
        (state, newCompletedStatus: boolean) => ({
            ...state,
            completed_at: newCompletedStatus ? new Date().toISOString() : null,
        })
    );

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: optimisticCard.id,
        data: { type: 'Card', card: optimisticCard },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isCompleted = !!optimisticCard.completed_at;

    const getMarkIcon = () => {
        if (isCompleted) {
            return <CheckCircle className="h-5 w-5 text-green-600" />;
        }
        return <Circle className="h-5 w-5 text-gray-500" />;
    };

    const handleMarkCard = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(() => {
            const isTogglingToComplete = !optimisticCard.completed_at;
            setOptimisticCard(isTogglingToComplete);
            markCard(card.id, boardId, card.title, card.completed_at);
        });
    };

    // --- BẮT ĐẦU THAY ĐỔI ---
    const dueDateInfo = useMemo(() => {
        if (!optimisticCard.dued_at) return null;

        const dueDate = new Date(optimisticCard.dued_at);
        const now = new Date();
        // So sánh ngày, không tính giờ để xác định quá hạn
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        const isOverdue = dueDay < today && !isCompleted;

        let bgColor = 'bg-gray-200';
        let textColor = 'text-gray-700';
        let iconColor = 'text-gray-700';

        if (isCompleted) {
            bgColor = 'bg-green-600';
            textColor = 'text-white';
            iconColor = 'text-white';
        } else if (isOverdue) {
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            iconColor = 'text-white';
        }

        const formattedDate = dueDate.toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            // Chỉ hiển thị năm nếu không phải là năm hiện tại
            year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        }).replace(' tháng', ' thg');

        return { bgColor, textColor, iconColor, formattedDate, isOverdue };
    }, [optimisticCard.dued_at, isCompleted]);
    // --- KẾT THÚC THAY ĐỔI ---

    const cardStats = useMemo(() => {
        // ... (phần code này không đổi)
        const hasDescription = !!optimisticCard.description;
        const attachmentCount = optimisticCard.Attachments?.[0]?.count ?? 0;

        let totalChecklistItems = 0;
        let completedChecklistItems = 0;
        if (optimisticCard.Checklists) {
            for (const checklist of optimisticCard.Checklists) {
                totalChecklistItems += checklist.checklist_items.length;
                completedChecklistItems += checklist.checklist_items.filter(item => item.is_completed).length;
            }
        }
        const allChecklistItemsCompleted = totalChecklistItems > 0 && totalChecklistItems === completedChecklistItems;

        return {
            hasDescription,
            attachmentCount,
            totalChecklistItems,
            completedChecklistItems,
            allChecklistItemsCompleted
        };
    }, [optimisticCard]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative bg-white rounded-lg shadow-sm mb-2 cursor-grab active:cursor-grabbing"
        >
            {(isHovered || isCompleted) && (
                <div className="absolute top-1/2 -translate-y-1/2 left-2.5 z-10">
                    <button
                        onClick={handleMarkCard}
                        disabled={isPending}
                        title={isCompleted ? "Đánh dấu chưa hoàn tất" : "Đánh dấu hoàn tất"}
                        className="p-0.5 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {getMarkIcon()}
                    </button>
                </div>
            )}

            {isCompleted && (
                <div
                    className="absolute -top-1 -left-1 h-8 w-8 bg-contain bg-center bg-no-repeat z-10"
                    style={{backgroundImage: "url('/check-sticker.png')"}}
                    title={`Hoàn thành vào ${new Date(optimisticCard.completed_at!).toLocaleDateString('vi-VN')}`}
                ></div>
            )}

            <Link
                href={`/board/${boardId}/card/${optimisticCard.id}`}
                scroll={false}
                className="block p-3"
                style={{
                    paddingLeft: (isHovered || isCompleted || optimisticCard.completed_at !== card.completed_at)
                        ? '2.5rem'
                        : '0.625rem',
                    transition: 'padding-left 150ms ease-in-out'
                }}
            >
                {/* --- BẮT ĐẦU THAY ĐỔI: Hiển thị Labels --- */}
                {optimisticCard.labels && optimisticCard.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {optimisticCard.labels.map(label => (
                            <div key={label.id} className="relative group">
                                <span
                                    className="block h-2 w-10 rounded-sm"
                                    style={{ backgroundColor: label.color }}
                                />
                                <Tooltip text={label.name} />
                            </div>
                        ))}
                    </div>
                )}
                {/* --- KẾT THÚC THAY ĐỔI --- */}

                <p className={`text-sm text-gray-800 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                    {optimisticCard.title}
                </p>

                {/* --- BẮT ĐẦU THAY ĐỔI: Hiển thị các chỉ số, bao gồm ngày hết hạn --- */}
                {(dueDateInfo || cardStats.hasDescription || cardStats.attachmentCount > 0 || cardStats.totalChecklistItems > 0) && (
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-gray-600">
                        {dueDateInfo && (
                            <div className={`relative group flex items-center gap-1 px-1.5 py-0.5 rounded ${dueDateInfo.bgColor} ${dueDateInfo.textColor}`}>
                                <Clock size={16} className={dueDateInfo.iconColor} />
                                <span className="text-xs font-medium">
                                    {dueDateInfo.formattedDate}
                                </span>
                                <Tooltip text={dueDateInfo.isOverdue ? "Thẻ này đã quá hạn" : "Ngày hết hạn"} />
                            </div>
                        )}

                        {cardStats.hasDescription && (
                            <div className="relative group flex items-center">
                                <AlignLeft size={16} />
                                <Tooltip text="Thẻ đã có miêu tả." />
                            </div>
                        )}
                        {cardStats.attachmentCount > 0 && (
                            <div className="relative group flex items-center gap-1">
                                <Paperclip size={16} />
                                <span className="text-xs font-medium">{cardStats.attachmentCount}</span>
                                <Tooltip text="Các tập tin đính kèm" />
                            </div>
                        )}
                        {cardStats.totalChecklistItems > 0 && (
                            <div className={`relative group flex items-center gap-1 px-1.5 py-0.5 rounded ${
                                cardStats.allChecklistItemsCompleted ? 'bg-green-600 text-white' : 'bg-gray-200'
                            }`}>
                                <CheckSquare size={16} />
                                <span className="text-xs font-medium">
                                    {cardStats.completedChecklistItems}/{cardStats.totalChecklistItems}
                                </span>
                                <Tooltip text="Mục trong danh sách công việc" />
                            </div>
                        )}
                    </div>
                )}
                {/* --- KẾT THÚC THAY ĐỔI --- */}
            </Link>

            {isCompleted && (
                <div className="absolute top-1/2 -translate-y-1/2 right-2.5 z-10 flex items-center space-x-1">
                    <button className="p-1 text-gray-600 hover:text-gray-900" title="Lưu trữ thẻ">
                        <Trash2 size={16} />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-900" title="Sửa thẻ">
                        <Pencil size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};