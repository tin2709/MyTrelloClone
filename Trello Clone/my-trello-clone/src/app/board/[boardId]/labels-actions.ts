// app/actions/labels-actions.ts
'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

// Định nghĩa kiểu dữ liệu cho Label để tái sử dụng
interface Label {
    id: string;
    created_at: string;
    name: string | null;
    color: string;
    updated_at: string | null;
    board_id: string;
}

// Kiểu trả về chung
interface ActionState {
    success?: boolean;
    error?: string;
    errors?: { // Lỗi chi tiết cho từng trường
        name?: string;
        color?: string;
    }
}

// Kiểu trả về riêng cho hàm create, có thể chứa dữ liệu của label mới
interface CreateLabelState extends ActionState {
    label?: Label;
}


/**
 * Gắn hoặc gỡ một nhãn khỏi một thẻ.
 */
export async function toggleLabelOnCard(
    cardId: string,
    labelId: string,
    boardId: string,
    cardTitle: string,
    labelName: string | null,
    isCurrentlySelected: boolean
): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    try {
        if (isCurrentlySelected) {
            // --- GỠ NHÃN KHỎI THẺ ---
            const { error } = await supabase
                .from('Card_labels')
                .delete()
                .match({ card_id: cardId, label_id: labelId });

            if (error) throw error;

            // Ghi log và revalidate
            after(async () => {
                try {
                    await supabase.from('Activities').insert({
                        user_id: user.id,
                        board_id: boardId,
                        action_type: 'REMOVE_LABEL_FROM_CARD',
                        metadata: { card_name: cardTitle, label_name: labelName || '' }
                    });
                    revalidatePath(`/board/${boardId}`);
                } catch (err) {
                    console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho gỡ nhãn:", err);
                }
            });

        } else {
            // --- GẮN NHÃN VÀO THẺ ---
            const { error } = await supabase
                .from('Card_labels')
                .insert({ card_id: cardId, label_id: labelId });

            if (error) throw error;

            // Ghi log và revalidate
            after(async () => {
                try {
                    await supabase.from('Activities').insert({
                        user_id: user.id,
                        board_id: boardId,
                        action_type: 'ADD_LABEL_TO_CARD',
                        metadata: { card_name: cardTitle, label_name: labelName || '' }
                    });
                    revalidatePath(`/board/${boardId}`);
                } catch (err) {
                    console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho gắn nhãn:", err);
                }
            });
        }

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi cập nhật nhãn trên thẻ:", error.message);
        return { error: "Không thể cập nhật nhãn. Vui lòng thử lại." };
    }
}

/**
 * Tạo một nhãn mới cho một board.
 */
export async function createLabel(
    prevState: CreateLabelState,
    formData: FormData
): Promise<CreateLabelState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const name = formData.get('name') as string;
    const color = formData.get('color') as string;
    const boardId = formData.get('boardId') as string;

    // --- Validation ---
    const errors: ActionState['errors'] = {};
    if (!name || name.trim().length === 0) {
        errors.name = 'Tên nhãn không được để trống.';
    }
    if (!color) {
        errors.color = 'Vui lòng chọn một màu.';
    }
    if (Object.keys(errors).length > 0) {
        return { errors };
    }
    // --- Kết thúc Validation ---

    try {
        const { data: newLabel, error } = await supabase
            .from('Labels')
            .insert({
                name: name.trim(),
                color: color,
                board_id: boardId
            })
            .select()
            .single();

        if (error) throw error;

        // Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'CREATE_LABEL',
                    metadata: { label_name: newLabel.name }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho tạo nhãn:", err);
            }
        });

        return { success: true, label: newLabel };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi tạo nhãn:", error.message);
        return { error: "Không thể tạo nhãn mới. Vui lòng thử lại." };
    }
}

/**
 * Cập nhật tên hoặc màu của một nhãn đã có.
 */
export async function updateLabel(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const labelId = formData.get('labelId') as string;
    const boardId = formData.get('boardId') as string;
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;

    // --- Validation ---
    if (!labelId || !boardId) {
        return { error: "Thiếu thông tin cần thiết để cập nhật." };
    }
    const errors: ActionState['errors'] = {};
    if (!name || name.trim().length === 0) {
        errors.name = 'Tên nhãn không được để trống.';
    }
    if (!color) {
        errors.color = 'Vui lòng chọn một màu.';
    }
    if (Object.keys(errors).length > 0) {
        return { errors };
    }
    // --- Kết thúc Validation ---

    try {
        const { error } = await supabase
            .from('Labels')
            .update({ name: name.trim(), color: color, updated_at: new Date().toISOString() })
            .eq('id', labelId);

        if (error) throw error;

        // Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'UPDATE_LABEL',
                    metadata: { label_id: labelId, new_label_name: name.trim() }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho cập nhật nhãn:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi cập nhật nhãn:", error.message);
        return { error: "Không thể cập nhật nhãn. Vui lòng thử lại." };
    }
}


/**
 * Xóa một nhãn khỏi board.
 * Hành động này sẽ tự động gỡ nhãn khỏi tất cả các thẻ đang dùng nó (do foreign key cascade).
 */
export async function deleteLabel(
    labelId: string,
    boardId: string,
    labelName: string | null
): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    if (!labelId || !boardId) {
        return { error: "Thiếu thông tin cần thiết để xóa." };
    }

    try {
        const { error } = await supabase
            .from('Labels')
            .delete()
            .eq('id', labelId);

        if (error) throw error;

        // Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'DELETE_LABEL',
                    metadata: { label_name: labelName || 'Không tên' }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho xóa nhãn:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi xóa nhãn:", error.message);
        return { error: "Không thể xóa nhãn. Vui lòng thử lại." };
    }
}