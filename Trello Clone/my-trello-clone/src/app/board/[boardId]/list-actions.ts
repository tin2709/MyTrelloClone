// src/app/board/[boardId]/list-actions.ts
'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';

// Định nghĩa kiểu dữ liệu cho state của form
interface CreateListState {
    success?: boolean;
    error?: string;
    errors?: {
        title?: string;
    },
    // Trả về list vừa tạo để cập nhật UI ngay lập tức
    list?: { id: string; title: string; cards: [] };
}

export async function createList(
    prevState: CreateListState,
    formData: FormData
): Promise<CreateListState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập để thực hiện hành động này." };
    }

    const title = formData.get('title') as string;
    const boardId = formData.get('boardId') as string;

    if (!title || title.trim().length === 0) {
        return { errors: { title: "Tiêu đề không được để trống." } };
    }

    try {
        // 1. Tính toán vị trí (position) cho danh sách mới
        const { data: maxPositionData, error: positionError } = await supabase
            .from('Lists')
            .select('position')
            .eq('board_id', boardId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        if (positionError && positionError.code !== 'PGRST116') { // PGRST116 = not found, which is OK
            throw positionError;
        }

        const newPosition = maxPositionData ? maxPositionData.position + 1 : 0;

        // 2. Thêm danh sách mới vào database
        const { data: newList, error: insertError } = await supabase
            .from('Lists')
            .insert({
                title: title.trim(),
                board_id: boardId,
                position: newPosition
            })
            .select('id, title')
            .single();

        if (insertError) {
            throw insertError;
        }

        revalidatePath(`/board/${boardId}`);
        return { success: true, list: { ...newList, cards: [] } }; // Thêm mảng cards rỗng

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi tạo danh sách:", error.message);
        return { error: "Không thể tạo danh sách. Vui lòng thử lại." };
    }
}