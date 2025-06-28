// app/dashboard/board-actions.ts
'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';

// SỬA ĐỔI 1: Cập nhật interface để chứa lỗi của từng trường (field-specific errors)
export interface CreateBoardState {
    success?: boolean;
    error?: string | null; // Lỗi chung cho form
    boardId?: string | null;
    errors?: { // Lỗi cho từng trường
        title?: string;
        workspaceId?: string;
    }
}

// SỬA ĐỔI 2: Cập nhật logic hàm để trả về lỗi chi tiết
export async function createBoard(
    prevState: CreateBoardState,
    formData: FormData
): Promise<CreateBoardState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // Đây là lỗi chung, không phải lỗi của trường cụ thể
        return { error: 'Bạn phải đăng nhập để tạo bảng.' };
    }

    const title = formData.get('title') as string;
    const workspaceId = formData.get('workspaceId') as string;

    // --- Bắt đầu Validation ---
    const errors: CreateBoardState['errors'] = {};

    if (!title || title.trim().length === 0) {
        errors.title = 'Tiêu đề bảng không được để trống.';
    }
    if (!workspaceId) {
        errors.workspaceId = 'Vui lòng chọn một không gian làm việc.';
    }

    // Nếu có lỗi, trả về ngay lập tức
    if (Object.keys(errors).length > 0) {
        return { errors };
    }
    // --- Kết thúc Validation ---

    const { data: newBoard, error } = await supabase
        .from('Boards')
        .insert({
            title: title.trim(),
            workspace_id: workspaceId,
            user_id: user.id
        })
        .select('id')
        .single();

    if (error) {
        console.error('Lỗi khi tạo bảng:', error);
        return { error: `Đã xảy ra lỗi từ server. Vui lòng thử lại.` };
    }

    revalidatePath('/dashboard');

    return { success: true, boardId: newBoard.id };
}