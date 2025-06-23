// src/app/dashboard/board-actions.ts
'use server';

import { createClient } from "@/lib/supabase/supabaseServer";
import { revalidatePath } from "next/cache";

export interface CreateBoardState {
    error?: string;
    success?: boolean;
}

export async function createBoard(
    prevState: CreateBoardState,
    formData: FormData
): Promise<CreateBoardState> {
    const supabase = await createClient();

    // Lấy dữ liệu từ form
    const title = formData.get('title') as string;
    const workspaceId = formData.get('workspaceId') as string;

    // Validate dữ liệu
    if (!title || !workspaceId) {
        return { error: 'Tiêu đề và không gian làm việc là bắt buộc.' };
    }

    // Chèn vào database
    const { error } = await supabase.from('Boards').insert({
        title: title,
        workspace_id: workspaceId,
        // bạn có thể thêm các trường khác như 'background_color' ở đây
    });

    if (error) {
        console.error("Lỗi khi tạo bảng:", error);
        return { error: `Không thể tạo bảng: ${error.message}` };
    }

    // Revalidate lại trang dashboard để hiển thị bảng mới
    revalidatePath('/dashboard');
    return { success: true };
}