'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';

// Interface dùng chung cho các kết quả trả về của action
interface ActionState {
    success?: boolean;
    error?: string;
    errors?: { title?: string }; // Dành cho lỗi validation của form
}

// Interface riêng cho action createList
interface CreateListState extends ActionState {
    list?: { id: string; title: string; cards: [] };
}

/**
 * Cập nhật vị trí của nhiều danh sách cùng lúc.
 * Thường được gọi sau khi người dùng kéo-thả để sắp xếp lại các danh sách.
 */
export async function updateListOrder(
    items: { id: string; position: number }[],
    boardId: string
): Promise<ActionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Bạn phải đăng nhập để thực hiện hành động này." };
    }

    if (!items || items.length === 0 || !boardId) {
        return { success: false, error: "Dữ liệu không hợp lệ." };
    }

    try {
        const updatePromises = items.map(item =>
            supabase
                .from('Lists')
                .update({ position: item.position })
                .eq('id', item.id)
        );

        const results = await Promise.all(updatePromises);

        const firstError = results.find(result => result.error);
        if (firstError) {
            throw firstError.error;
        }

        revalidatePath(`/board/${boardId}`);
        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi cập nhật thứ tự danh sách:", error);
        return { success: false, error: `Không thể cập nhật thứ tự: ${error.message}` };
    }
}

/**
 * Sao chép một danh sách và tất cả các thẻ bên trong nó.
 */
export async function copyList(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const newTitle = formData.get('title') as string;
    const originalListId = formData.get('originalListId') as string;
    const boardId = formData.get('boardId') as string;

    if (!newTitle || newTitle.trim().length === 0) {
        return { errors: { title: "Tiêu đề không được để trống." } };
    }
    if (!originalListId || !boardId) {
        return { error: "Thiếu thông tin cần thiết." };
    }

    try {
        const { data: originalCards, error: fetchError } = await supabase
            .from('Cards')
            .select('title, board_id, position, description')
            .eq('list_id', originalListId);

        if (fetchError) throw fetchError;

        const { data: maxPos } = await supabase
            .from('Lists')
            .select('position')
            .eq('board_id', boardId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const newPosition = maxPos ? maxPos.position + 1 : 0;

        const { data: newList, error: listError } = await supabase
            .from('Lists')
            .insert({ title: newTitle.trim(), board_id: boardId, position: newPosition })
            .select('id')
            .single();

        if (listError || !newList) throw listError || new Error("Không thể tạo danh sách.");

        if (originalCards && originalCards.length > 0) {
            const newCards = originalCards.map(card => ({
                ...card,
                list_id: newList.id,
            }));
            const { error: cardsError } = await supabase.from('Cards').insert(newCards);
            if (cardsError) throw cardsError;
        }

        revalidatePath(`/board/${boardId}`);
        return { success: true };

    } catch (e) {
        const error = e as Error;
        return { error: `Không thể sao chép: ${error.message}` };
    }
}

/**
 * Tạo một danh sách mới.
 */
export async function createList(
    prevState: CreateListState,
    formData: FormData
): Promise<CreateListState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const title = formData.get('title') as string;
    const boardId = formData.get('boardId') as string;

    if (!title || title.trim().length === 0) {
        return { errors: { title: "Tiêu đề không được để trống." } };
    }

    try {
        const { data: maxPos } = await supabase
            .from('Lists')
            .select('position')
            .eq('board_id', boardId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const newPosition = maxPos ? maxPos.position + 1 : 0;

        const { data: newList, error } = await supabase
            .from('Lists')
            .insert({ title: title.trim(), board_id: boardId, position: newPosition })
            .select('id, title')
            .single();

        if (error || !newList) throw error || new Error("Không thể tạo danh sách.");

        revalidatePath(`/board/${boardId}`);
        return { success: true, list: { ...newList, cards: [] } };

    } catch (e) {
        const error = e as Error;
        return { error: `Không thể tạo danh sách: ${error.message}` };
    }
}

// =======================================================================
// --- ACTION MỚI: DI CHUYỂN DANH SÁCH ---
// =======================================================================
type MoveListState = ActionState

export async function moveList(
    prevState: MoveListState,
    formData: FormData
): Promise<MoveListState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const listId = formData.get('listId') as string;
    const currentBoardId = formData.get('currentBoardId') as string;
    const targetBoardId = formData.get('targetBoardId') as string;
    const newPosition = parseInt(formData.get('position') as string, 10);

    if (!listId || !targetBoardId || !currentBoardId || isNaN(newPosition)) {
        return { error: "Dữ liệu không hợp lệ." };
    }

    try {
        // Gọi hàm RPC `move_list_and_reorder` đã tạo trong Supabase SQL Editor
        const { error } = await supabase.rpc('move_list_and_reorder', {
            p_list_id: listId,
            p_target_board_id: targetBoardId,
            p_new_position: newPosition,
            p_user_id: user.id
        });

        if (error) {
            throw error;
        }

        revalidatePath(`/board/${currentBoardId}`);
        if (currentBoardId !== targetBoardId) {
            revalidatePath(`/board/${targetBoardId}`);
        }

        return { success: true };

    } catch (e) {
        const error = e as Error;
        return { error: `Không thể di chuyển danh sách: ${error.message}` };
    }

}
type MoveAllCardsState = ActionState

export async function moveAllCards(
    prevState: MoveAllCardsState,
    formData: FormData
): Promise<MoveAllCardsState> {
    const supabase = await createClient();

    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
        return {error: "Bạn phải đăng nhập."};
    }

    const sourceListId = formData.get('sourceListId') as string;
    const destinationListId = formData.get('destinationListId') as string;
    const boardId = formData.get('boardId') as string; // Cần để revalidate

    // --- Validation ---
    if (!sourceListId || !destinationListId || !boardId) {
        return {error: "Thiếu thông tin cần thiết (sourceListId, destinationListId, boardId)."};
    }
    if (sourceListId === destinationListId) {
        return {error: "Không thể di chuyển thẻ đến chính danh sách đó."};
    }

    try {
        // Gọi hàm RPC `move_all_cards_between_lists` đã tạo ở Bước 1
        const {error} = await supabase.rpc('move_all_cards_between_lists', {
            p_source_list_id: sourceListId,
            p_destination_list_id: destinationListId,
            p_user_id: user.id
        });

        if (error) {
            // Ném lỗi để bắt ở khối catch bên dưới
            throw error;
        }

        // Revalidate lại đường dẫn của bảng để cập nhật UI
        revalidatePath(`/board/${boardId}`);
        return {success: true};

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi di chuyển toàn bộ thẻ:", error);
        return {error: `Không thể di chuyển các thẻ: ${error.message}`};
    }
}