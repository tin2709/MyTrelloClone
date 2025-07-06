// app/(main)/boards/[boardId]/@modal/(..)[cardId]/components/dates-popup.jsx
'use client';

// React & Next.js Core
import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';

// Server Actions
import { updateCardDates } from '../../../card-actions';

// Third-party Libraries & Styles
import { DayPicker, DateRange } from 'react-day-picker';
import { vi } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

// Icons
import { LuX } from 'react-icons/lu';

// --- TYPE DEFINITIONS ---
interface CardDetails { id: string; title: string; description: string | null; started_at: string | null; dued_at: string | null; completed_at: string | null; list: { title: string } | null; }

export function DatesPopup({ card, boardId, onClose, onSaveSuccess }: {
    card: CardDetails,
    boardId: string,
    onClose: () => void,
    onSaveSuccess: (updates: Partial<Pick<CardDetails, 'started_at' | 'dued_at'>>) => void
}) {
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

    useEffect(() => {
        if (state.success) {
            const newStartedAt = startDateEnabled && range?.from
                ? range.from.toISOString()
                : null;

            const effectiveDueDate = range?.to || range?.from;
            const newDuedAt = dueDateEnabled && effectiveDueDate
                ? combineDateAndTime(effectiveDueDate, dueTime).toISOString()
                : null;

            onSaveSuccess({
                started_at: newStartedAt,
                dued_at: newDuedAt,
            });

            onClose();
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
                        {/* Form content remains the same */}
                        <div>
                            <label className="text-xs font-bold text-gray-500">Ngày bắt đầu</label>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={startDateEnabled} onChange={(e) => setStartDateEnabled(e.target.checked)} />
                                <input type="text" readOnly value={formatDateForInput(range?.from)} className="w-full px-2 py-1.5 border rounded-md text-sm bg-gray-100" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">Ngày hết hạn</label>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={dueDateEnabled} onChange={(e) => setDueDateEnabled(e.target.checked)} />
                                <input type="text" readOnly value={formatDateForInput(range?.to || range?.from)} className="w-full px-2 py-1.5 border rounded-md text-sm bg-gray-100" />
                                <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm" />
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
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md font-medium text-sm hover:bg-blue-700">Lưu</button>
                        <button type="button" onClick={handleRemove} className="w-full bg-gray-200 text-gray-800 py-2 rounded-md font-medium text-sm hover:bg-gray-300">Gỡ bỏ</button>
                    </form>
                </div>
            </div>
        </div>
    );
};