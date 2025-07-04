// src/app/board/[boardId]/checklist-actions.ts
'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server'; // Thêm import after()

// --- TYPES ---
interface ChecklistState {
    success?: boolean;
    error?: string;
    checklist?: { id: string; title: string; card_id: string; position: number };
}

// --- ACTION 1: TẠO MỘT CHECKLIST MỚI ---
export async function createChecklist(
    prevState: ChecklistState,
    formData: FormData
): Promise<ChecklistState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const title = formData.get('title') as string;
    const cardId = formData.get('cardId') as string;
    const boardId = formData.get('boardId') as string;

    if (!title?.trim()) {
        return { error: "Tiêu đề không được để trống." };
    }

    try {
        const { data: maxPosChecklist } = await supabase
            .from('Checklists')
            .select('position')
            .eq('card_id', cardId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const newPosition = maxPosChecklist ? maxPosChecklist.position + 1 : 0;

        // Tác vụ cốt lõi: Insert checklist mới vào DB
        const { data: newChecklist, error } = await supabase
            .from('Checklists')
            .insert({
                title: title.trim(),
                card_id: cardId,
                position: newPosition,
            })
            .select()
            .single();

        if (error || !newChecklist) throw error;

        // Tác vụ phụ: Revalidate path
        after(() => {
            try {
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi revalidate sau khi tạo checklist:", err);
            }
        });

        // Trả về thành công ngay lập tức
        return { success: true, checklist: newChecklist };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi tạo checklist:", error.message);
        return { error: "Không thể tạo danh sách công việc." };
    }
}

// --- ACTION 2: XÓA MỘT CHECKLIST ---
export async function deleteChecklist(
    checklistId: string,
    boardId: string,
): Promise<{success?: boolean, error?: string}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    try {
        // Tác vụ cốt lõi: Xóa checklist
        const { error } = await supabase
            .from('Checklists')
            .delete()
            .eq('id', checklistId);

        if (error) throw error;

        // Tác vụ phụ: Revalidate path
        after(() => {
            try {
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi revalidate sau khi xóa checklist:", err);
            }
        });

        // Trả về thành công ngay lập tức
        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi xóa checklist:", error.message);
        return { error: "Không thể xóa danh sách công việc." };
    }
}