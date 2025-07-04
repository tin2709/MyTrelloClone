// src/app/board/[boardId]/checklist-item-actions.ts
'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
import { Database } from '@/lib/type';
import { after } from 'next/server'; // Thêm import after()

type ChecklistItem = Database['public']['Tables']['Checklist_items']['Row'];

// --- TYPES ---
interface ChecklistItemState {
    success?: boolean;
    error?: string;
    item?: ChecklistItem;
}

// --- HÀM 1: TẠO MỘT MỤC CON TRONG CHECKLIST ---
export async function createChecklistItem(
    prevState: ChecklistItemState,
    formData: FormData
): Promise<ChecklistItemState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const text = formData.get('text') as string;
    const checklistId = formData.get('checklistId') as string;
    const boardId = formData.get('boardId') as string;

    if (!text?.trim()) {
        return { success: false };
    }

    try {
        const { data: maxPosItem } = await supabase
            .from('Checklist_items')
            .select('position')
            .eq('checklist_id', checklistId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const newPosition = maxPosItem ? maxPosItem.position + 1 : 0;

        // Tác vụ cốt lõi: Tạo mục mới
        const { data: newItem, error } = await supabase
            .from('Checklist_items')
            .insert({
                text: text.trim(),
                checklist_id: checklistId,
                position: newPosition,
            })
            .select()
            .single();

        if (error || !newItem) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                const { data: checklistData } = await supabase.from('Checklists').select('title').eq('id', checklistId).single();
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'CREATE_CHECKLIST_ITEM',
                    metadata: {
                        checklist_name: checklistData?.title || 'Không rõ',
                        item_text: newItem.text,
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho createChecklistItem:", err);
            }
        });

        // Trả về thành công ngay lập tức
        return { success: true, item: newItem };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi tạo mục con:", error.message);
        return { error: "Không thể tạo mục." };
    }
}

// --- HÀM 2: CẬP NHẬT TRẠNG THÁI CỦA MỘT MỤC CON ---
export async function updateChecklistItemStatus(
    itemId: string,
    isCompleted: boolean,
    boardId: string
): Promise<{success?: boolean, error?: string}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    try {
        // Tác vụ cốt lõi: Cập nhật trạng thái
        const { data: updatedItem, error } = await supabase
            .from('Checklist_items')
            .update({ is_completed: isCompleted })
            .eq('id', itemId)
            .select('text')
            .single();

        if (error || !updatedItem) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'UPDATE_CHECKLIST_ITEM',
                    metadata: {
                        item_text: updatedItem.text,
                        status: isCompleted ? 'completed' : 'uncompleted',
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho updateChecklistItemStatus:", err);
            }
        });

        // Trả về thành công ngay lập tức
        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi cập nhật trạng thái mục:", error.message);
        return { error: "Không thể cập nhật trạng thái." };
    }
}

// --- HÀM 3: XÓA MỘT MỤC CON ---
export async function deleteChecklistItem(
    itemId: string,
    boardId: string
): Promise<{success?: boolean, error?: string}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    try {
        // Tác vụ cốt lõi: Xóa mục
        const { error } = await supabase
            .from('Checklist_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        // Tác vụ phụ: Revalidate
        after(() => {
            try {
                // Bạn có thể thêm ghi log hoạt động ở đây nếu cần
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi revalidate sau khi xóa mục checklist:", err);
            }
        });

        // Trả về thành công ngay lập tức
        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi xóa mục checklist:", error.message);
        return { error: `Không thể xóa mục: ${error.message}` };
    }
}