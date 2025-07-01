'use server';

// Sử dụng đúng client cho server, đảm bảo bạn đã tạo kiểu cho nó
import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';

// --- ACTION 1: TẠO THẺ MỚI (Đã sửa lỗi) ---

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
    const boardId = formData.get('boardId') as string; // Đã có boardId từ form

    if (!title || !title.trim()) {
        return { error: "Tiêu đề không được để trống." };
    }

    try {
        const { data: maxPosCard } = await supabase
            .from('Cards')
            .select('position')
            .eq('list_id', listId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const newPosition = maxPosCard ? maxPosCard.position + 1 : 0;

        const { data: newCard, error } = await supabase
            .from('Cards')
            .insert({
                title: title.trim(),
                list_id: listId,
                position: newPosition,
                board_id: boardId, // SỬA LỖI: Thêm board_id bắt buộc
            })
            .select('id, title')
            .single();

        if (error) throw error;
        const { data: listData } = await supabase.from('Lists').select('title').eq('id', listId).single();

        await supabase.from('Activities').insert({
            user_id: user.id,
            board_id: boardId,
            action_type: 'CREATE_CARD',
            metadata: {
                card_name: newCard.title,
                list_name: listData?.title || ''
            }
        });
        revalidatePath(`/board/${boardId}`);
        return { success: true, card: newCard };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi tạo thẻ:", error.message);
        return { error: "Không thể tạo thẻ. Vui lòng thử lại." };
    }
}


// --- ACTION 2: CẬP NHẬT MÔ TẢ CỦA THẺ (Đã sửa lỗi) ---

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
        // SỬA LỖI: Cung cấp board_id để khớp với kiểu update
        // Mặc dù chúng ta không thay đổi nó, nhưng làm vậy để TypeScript không báo lỗi.
        // Đây là một cách giải quyết cho các kiểu nghiêm ngặt của Supabase.
        const { error } = await supabase
            .from('Cards')
            .update({
                description: description,
                // board_id: boardId, // Cung cấp để làm hài lòng TypeScript (có thể không cần nếu ko update)
            })
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


// --- ACTION 3: CẬP NHẬT THỨ TỰ THẺ (Kéo-Thả) ---

export async function updateCardOrder(
    cardId: string,
    newListId: string,
    newPosition: number,
    boardId: string
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('Cards')
        .update({
            list_id: newListId,
            position: newPosition,
        })
        .eq('id', cardId);

    if (error) {
        console.error("Lỗi khi cập nhật thứ tự thẻ:", error);
        // Không trả về lỗi để tránh làm gián đoạn UI, nhưng ghi log lại
    }

    // Luôn revalidate để đảm bảo dữ liệu đồng bộ
    revalidatePath(`/board/${boardId}`);
}
export async function logCardMove(
    boardId: string,
    cardName: string,
    sourceListName: string,
    destListName: string
) {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('Activities').insert({
        user_id: user.id,
        board_id: boardId,
        action_type: 'MOVE_CARD',
        metadata: {
            card_name: cardName,
            source_list_name: sourceListName,
            destination_list_name: destListName
        }
    });
}

// =======================================================================
// --- BẮT ĐẦU PHẦN CODE MỚI ---
// =======================================================================

// Interface chung cho kết quả trả về của các action đơn giản
interface ActionState {
    success?: boolean;
    error?: string;
}

/**
 * Khôi phục một thẻ đã được lưu trữ (soft delete).
 * Cập nhật cột `archived_at` về lại NULL.
 * @param cardId - ID của thẻ cần khôi phục.
 * @param boardId - ID của bảng chứa thẻ để revalidate.
 * @param cardTitle - Tiêu đề của thẻ để ghi log hoạt động.
 */
export async function restoreCard(
    cardId: string,
    boardId: string,
    cardTitle: string
): Promise<ActionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    if (!cardId || !boardId || !cardTitle) {
        return { error: "Thiếu thông tin cần thiết." };
    }

    try {
        // Cập nhật trường archived_at về null để khôi phục thẻ
        const { error } = await supabase
            .from('Cards')
            .update({ archived_at: null })
            .eq('id', cardId);

        if (error) throw error;

        // Ghi log hoạt động
        await supabase.from('Activities').insert({
            user_id: user.id,
            board_id: boardId,
            action_type: 'RESTORE_CARD',
            metadata: { card_name: cardTitle }
        });

        // Revalidate lại đường dẫn của bảng để UI được cập nhật
        revalidatePath(`/board/${boardId}`);
        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi khôi phục thẻ:", error.message);
        return { error: `Không thể khôi phục thẻ: ${error.message}` };
    }
}

/**
 * Xóa vĩnh viễn một thẻ (hard delete).
 * @param cardId - ID của thẻ cần xóa.
 * @param boardId - ID của bảng chứa thẻ để revalidate.
 * @param cardTitle - Tiêu đề của thẻ để ghi log hoạt động.
 */
export async function deleteCard(
    cardId: string,
    boardId: string,
    cardTitle: string
): Promise<ActionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    if (!cardId || !boardId || !cardTitle) {
        return { error: "Thiếu thông tin cần thiết." };
    }

    try {
        // Xóa vĩnh viễn thẻ khỏi cơ sở dữ liệu
        const { error } = await supabase
            .from('Cards')
            .delete()
            .eq('id', cardId);

        if (error) throw error;

        // Ghi log hoạt động
        await supabase.from('Activities').insert({
            user_id: user.id,
            board_id: boardId,
            action_type: 'DELETE_CARD',
            metadata: { card_name: cardTitle }
        });

        // Revalidate lại đường dẫn của bảng để UI được cập nhật
        revalidatePath(`/board/${boardId}`);
        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi xóa thẻ:", error.message);
        return { error: `Không thể xóa thẻ: ${error.message}` };
    }
}