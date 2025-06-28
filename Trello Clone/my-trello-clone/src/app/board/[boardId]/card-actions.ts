// src/app/board/[boardId]/card-actions.ts
'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';

// --- ACTION 1: TẠO THẺ MỚI ---

interface CreateCardState {
    success?: boolean;
    error?: string;
    card?: { id: string; title: string; };
}

export async function createCard(
    prevState: CreateCardState,
    formData: FormData
): Promise<CreateCardState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const title = formData.get('title') as string;
    const listId = formData.get('listId') as string;
    const boardId = formData.get('boardId') as string;

    if (!title || title.trim().length === 0) {
        return { error: "Tiêu đề không được để trống." };
    }

    try {
        // Tính toán position cho card mới
        const { data: maxPosCard } = await supabase
            .from('Cards')
            .select('position')
            .eq('list_id', listId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const newPosition = maxPosCard ? maxPosCard.position + 1 : 0;

        // Thêm card vào DB
        const { data: newCard, error } = await supabase
            .from('Cards')
            .insert({
                title: title.trim(),
                list_id: listId,
                position: newPosition,
            })
            .select('id, title')
            .single();

        if (error) throw error;

        revalidatePath(`/board/${boardId}`);
        return { success: true, card: newCard };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi tạo thẻ:", error.message);
        return { error: "Không thể tạo thẻ. Vui lòng thử lại." };
    }
}


// --- ACTION 2: CẬP NHẬT MÔ TẢ CỦA THẺ ---

interface UpdateCardDescriptionState {
    success?: boolean;
    error?: string;
}

export async function updateCardDescription(
    prevState: UpdateCardDescriptionState,
    formData: FormData
): Promise<UpdateCardDescriptionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const cardId = formData.get('cardId') as string;
    const boardId = formData.get('boardId') as string;
    const description = formData.get('description') as string;

    try {
        const { error } = await supabase
            .from('Cards')
            .update({ description: description })
            .eq('id', cardId);

        if (error) throw error;

        revalidatePath(`/board/${boardId}`);
        return { success: true };

    } catch(e) {
        const error = e as Error;
        console.error("Lỗi khi cập nhật mô tả:", error.message);
        return { error: "Không thể cập nhật mô tả. Vui lòng thử lại." };
    }
}