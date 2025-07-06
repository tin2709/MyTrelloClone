// app/board/[boardId]/_components/labels-popup.tsx
'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { LuX, LuPencil, LuTrash2 } from 'react-icons/lu';

// import { toast } from 'sonner'; // Đã xóa hoặc comment dòng này

// Import các server actions liên quan đến nhãn
import {
    toggleLabelOnCard,
    createLabel,
    updateLabel,
    deleteLabel
} from '@/app/board/[boardId]/labels-actions';

// --- TYPE DEFINITIONS ---
interface Label {
    id: string;
    name: string | null;
    color: string;
    board_id: string;
}

interface CardInfo {
    id: string;
    title: string;
}

interface LabelsPopupProps {
    card: CardInfo;
    boardId: string;
    allBoardLabels: Label[]; // Tất cả nhãn của board
    initialSelectedLabels: Label[]; // Các nhãn đã được chọn ban đầu cho thẻ
    onClose: () => void;
    onLabelsChange: (newLabels: Label[]) => void;
    onDataRefresh: () => void; // Callback để báo cho component cha tải lại dữ liệu
}

// --- SUB-COMPONENTS CHO FORM ---
const EditLabelForm = ({ label, onCancel, onSaveSuccess }: { label: Label, onCancel: () => void, onSaveSuccess: () => void }) => {
    const [state, formAction, isPending] = useActionState(updateLabel, { success: false });

    React.useEffect(() => {
        if (state.success) {
            alert("Đã cập nhật nhãn!"); // THAY ĐỔI Ở ĐÂY
            onSaveSuccess();
            onCancel();
        }
        if (state.error) {
            alert(`Lỗi: ${state.error}`); // THAY ĐỔI Ở ĐÂY
        }
    }, [state, onCancel, onSaveSuccess]);

    return (
        <form action={formAction} className="p-3 bg-gray-50 border rounded-md">
            <input type="hidden" name="labelId" value={label.id} />
            <input type="hidden" name="boardId" value={label.board_id} />
            <div className="space-y-2">
                <input name="name" defaultValue={label.name || ''} placeholder="Tên nhãn" className="w-full px-2 py-1.5 border rounded-md text-sm" />
                <input name="color" defaultValue={label.color} type="color" className="w-full h-8" />
            </div>
            <div className="flex items-center gap-2 mt-2">
                <button type="submit" disabled={isPending} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-300">Lưu</button>
                <button type="button" onClick={onCancel} className="text-sm">Hủy</button>
            </div>
        </form>
    );
};

const CreateLabelForm = ({ boardId, onCancel, onSaveSuccess }: { boardId: string, onCancel: () => void, onSaveSuccess: () => void }) => {
    const [state, formAction, isPending] = useActionState(createLabel, { success: false });

    React.useEffect(() => {
        if (state.success) {
            alert("Đã tạo nhãn mới!"); // THAY ĐỔI Ở ĐÂY
            onSaveSuccess();
            onCancel();
        }
        if (state.error) {
            alert(`Lỗi: ${state.error}`); // THAY ĐỔI Ở ĐÂY
        }
    }, [state, onCancel, onSaveSuccess]);

    return (
        <div className="p-3 bg-gray-50 border rounded-md">
            <h4 className="text-xs font-bold text-gray-500 mb-2">Tạo nhãn mới</h4>
            <form action={formAction} className="space-y-2">
                <input type="hidden" name="boardId" value={boardId} />
                <input name="name" placeholder="Tên nhãn" className="w-full px-2 py-1.5 border rounded-md text-sm" />
                <input name="color" defaultValue="#61bd4f" type="color" className="w-full h-8" />
                <div className="flex items-center gap-2">
                    <button type="submit" disabled={isPending} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-300">Tạo</button>
                    <button type="button" onClick={onCancel} className="text-sm">Hủy</button>
                </div>
            </form>
        </div>
    );
};


// --- MAIN POPUP COMPONENT ---
export const LabelsPopup = ({
                                card,
                                boardId,
                                allBoardLabels,
                                initialSelectedLabels,
                                onClose,
                                onLabelsChange,
                                onDataRefresh,
                            }: LabelsPopupProps) => {
    // State để quản lý các nhãn được chọn trong UI (cho optimistic updates)
    const [selectedLabels, setSelectedLabels] = useState(initialSelectedLabels);
    const [isPending, startTransition] = useTransition();

    // State cho việc hiển thị form sửa hoặc tạo
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const selectedLabelIds = new Set(selectedLabels.map(l => l.id));

    const handleLabelToggle = (label: Label) => {
        const isSelected = selectedLabelIds.has(label.id);

        // 1. Tính toán mảng nhãn mới
        const newLabelsArray = isSelected
            ? selectedLabels.filter(l => l.id !== label.id)
            : [...selectedLabels, label];

        // 2. Cập nhật state cục bộ của popup
        setSelectedLabels(newLabelsArray);

        // 3. GỌI CALLBACK ĐỂ CẬP NHẬT GIAO DIỆN CỦA COMPONENT CHA NGAY LẬP TỨC
        onLabelsChange(newLabelsArray);

        // 4. Gọi server action trong nền
        startTransition(async () => {
            const result = await toggleLabelOnCard(
                card.id,
                label.id,
                boardId,
                card.title,
                label.name,
                isSelected
            );

            if (result.error) {
                alert(`Lỗi: ${result.error}`);
                // Nếu lỗi, rollback cả state cục bộ và state của cha
                setSelectedLabels(initialSelectedLabels);
                onLabelsChange(initialSelectedLabels);
            }
        });
    };

    const handleDelete = async (label: Label) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nhãn "${label.name}"? Hành động này không thể hoàn tác.`)) return;

        const result = await deleteLabel(label.id, boardId, label.name);
        if (result.success) {
            alert("Đã xóa nhãn.");
            onDataRefresh(); // Yêu cầu component cha tải lại toàn bộ dữ liệu
        } else {
            alert(`Lỗi: ${result.error}`);
        }
    };

    return (
        <div className="absolute inset-0 bg-black/10 z-20 flex items-start justify-end pt-24" onClick={onClose}>
            <div className="bg-white rounded-md p-0 shadow-lg w-72" onClick={e => e.stopPropagation()}>
                {/* ... (phần header và form không đổi) */}
                <div className="relative flex items-center justify-center border-b p-2">
                    <span className="text-sm font-medium text-gray-700">Nhãn</span>
                    <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><LuX size={16} /></button>
                </div>
                <div className="p-3 space-y-2">
                    <input type="text" placeholder="Tìm nhãn..." className="w-full px-2 py-1.5 border rounded-md text-sm" />

                    {editingLabelId && (
                        <EditLabelForm label={allBoardLabels.find(l => l.id === editingLabelId)!} onCancel={() => setEditingLabelId(null)} onSaveSuccess={onDataRefresh} />
                    )}
                    {isCreating && (
                        <CreateLabelForm boardId={boardId} onCancel={() => setIsCreating(false)} onSaveSuccess={onDataRefresh} />
                    )}

                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-500">Nhãn</h4>
                        {allBoardLabels.map(label => (
                            <div key={label.id} className="flex items-center gap-3 group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded"
                                    checked={selectedLabelIds.has(label.id)}
                                    onChange={() => handleLabelToggle(label)}
                                    disabled={isPending}
                                />
                                <div className="flex-grow flex items-center gap-2 cursor-pointer" onClick={() => !isPending && handleLabelToggle(label)}>
                                    <div
                                        className="w-full h-8 rounded-sm flex items-center px-3"
                                        style={{ backgroundColor: label.color }}
                                    >
                                        <span className="text-white font-bold text-sm">{label.name}</span>
                                    </div>
                                </div>
                                <button onClick={() => setEditingLabelId(label.id)} className="p-1 text-gray-500 hover:text-gray-800"><LuPencil size={14} /></button>

                                {/* SỬA LỖI Ở ĐÂY: Thêm nút xóa và gọi hàm handleDelete */}
                                <button onClick={() => handleDelete(label)} className="p-1 text-gray-500 hover:text-red-600">
                                    <LuTrash2 size={14} />
                                </button>

                            </div>
                        ))}
                    </div>
                    <button onClick={() => setIsCreating(true)} className="w-full text-sm py-2 bg-gray-100 hover:bg-gray-200 rounded-md">Tạo nhãn mới</button>
                </div>
            </div>
        </div>
    );
};