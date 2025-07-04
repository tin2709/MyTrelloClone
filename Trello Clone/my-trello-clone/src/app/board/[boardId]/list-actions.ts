'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server'; // Thêm import after()

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
export interface ArchivedCard {
    id: string;
    title: string;
    Lists: {
        title: string;
    } | null;
}

/**
 * Cập nhật vị trí của nhiều danh sách cùng lúc.
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

        // Tác vụ phụ: revalidate path
        after(() => {
            try {
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi revalidate thứ tự danh sách:", err);
            }
        });

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
    const originalListTitle = formData.get('originalListTitle') as string || 'một danh sách';

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

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'COPY_LIST',
                    metadata: {
                        source_list_name: originalListTitle,
                        new_list_name: newTitle.trim()
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho copyList:", err);
            }
        });

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

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'CREATE_LIST',
                    metadata: { list_name: newList.title }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho createList:", err);
            }
        });

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
        const { data: listToMoveData, error: listError } = await supabase
            .from('Lists')
            .select('title')
            .eq('id', listId)
            .single();

        if (listError || !listToMoveData) throw listError || new Error("Không tìm thấy danh sách cần di chuyển.");

        // Tác vụ cốt lõi: Gọi RPC
        const { error } = await supabase.rpc('move_list_and_reorder', {
            p_list_id: listId,
            p_target_board_id: targetBoardId,
            p_new_position: newPosition,
            p_user_id: user.id
        });

        if (error) {
            throw error;
        }

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                let targetBoardName = '';
                if (currentBoardId === targetBoardId) {
                    const { data: boardData } = await supabase.from('Boards').select('title').eq('id', currentBoardId).single();
                    targetBoardName = boardData?.title || 'bảng hiện tại';
                } else {
                    const { data: boardData } = await supabase.from('Boards').select('title').eq('id', targetBoardId).single();
                    targetBoardName = boardData?.title || 'một bảng khác';
                }

                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: currentBoardId,
                    action_type: 'MOVE_LIST',
                    metadata: {
                        list_name: listToMoveData.title,
                        destination_board_name: targetBoardName,
                        is_different_board: currentBoardId !== targetBoardId
                    }
                });

                if (currentBoardId !== targetBoardId) {
                    const sourceBoardName = (await supabase.from('Boards').select('title').eq('id', currentBoardId).single()).data?.title || 'bảng khác';
                    await supabase.from('Activities').insert({
                        user_id: user.id,
                        board_id: targetBoardId,
                        action_type: 'RECEIVE_LIST',
                        metadata: { list_name: listToMoveData.title, source_board_name: sourceBoardName }
                    });
                }

                revalidatePath(`/board/${currentBoardId}`);
                if (currentBoardId !== targetBoardId) {
                    revalidatePath(`/board/${targetBoardId}`);
                }
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho moveList:", err);
            }
        });

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
    const boardId = formData.get('boardId') as string;

    if (!sourceListId || !destinationListId || !boardId) {
        return {error: "Thiếu thông tin cần thiết."};
    }
    if (sourceListId === destinationListId) {
        return {error: "Không thể di chuyển thẻ đến chính danh sách đó."};
    }

    try {
        const { error } = await supabase.rpc('move_all_cards_between_lists', {
            p_source_list_id: sourceListId,
            p_destination_list_id: destinationListId,
            p_user_id: user.id
        });

        if (error) {
            throw error;
        }

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                const { data: listsData } = await supabase.from('Lists').select('id, title').in('id', [sourceListId, destinationListId]);
                const sourceListName = listsData?.find(l => l.id === sourceListId)?.title;
                const destListName = listsData?.find(l => l.id === destinationListId)?.title;

                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'MOVE_ALL_CARDS',
                    metadata: {
                        source_list_name: sourceListName || 'một danh sách',
                        destination_list_name: destListName || 'một danh sách khác'
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho moveAllCards:", err);
            }
        });

        return {success: true};

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi di chuyển toàn bộ thẻ:", error);
        return {error: `Không thể di chuyển các thẻ: ${error.message}`};
    }
}

interface ArchiveListState extends ActionState {
    archivedListId?: string;
}
/**
 * Lưu trữ một danh sách (Soft Delete).
 */
export async function archiveList(
    prevState: ArchiveListState,
    formData: FormData
): Promise<ArchiveListState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const listId = formData.get('id') as string;
    const boardId = formData.get('boardId') as string;
    const listTitle = formData.get('title') as string;

    if (!listId || !boardId || !listTitle) {
        return { error: "Thiếu thông tin cần thiết." };
    }

    try {
        const { error } = await supabase
            .from('Lists')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', listId);

        if (error) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert([{
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'ARCHIVE_LIST',
                    metadata: { list_name: listTitle }
                }]);
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho archiveList:", err);
            }
        });

        return { success: true, archivedListId: listId };

    } catch (e) {
        const error = e as Error;
        return { error: `Không thể lưu trữ danh sách: ${error.message}` };
    }
}

type RestoreListState = ActionState;

/**
 * Khôi phục một danh sách đã lưu trữ.
 */
export async function restoreList(
    prevState: RestoreListState,
    formData: FormData
): Promise<RestoreListState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const listId = formData.get('id') as string;
    const boardId = formData.get('boardId') as string;
    const listTitle = formData.get('title') as string;

    if (!listId || !boardId || !listTitle) {
        return { error: "Thiếu thông tin cần thiết." };
    }

    try {
        const { error } = await supabase
            .from('Lists')
            .update({ archived_at: null })
            .eq('id', listId);

        if (error) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'RESTORE_LIST',
                    metadata: { list_name: listTitle }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho restoreList:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        return { error: `Không thể khôi phục danh sách: ${error.message}` };
    }
}


type DeleteListState = ActionState;

/**
 * Xóa vĩnh viễn một danh sách (Hard Delete).
 */
export async function deleteList(
    prevState: DeleteListState,
    formData: FormData
): Promise<DeleteListState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const listId = formData.get('id') as string;
    const boardId = formData.get('boardId') as string;
    const listTitle = formData.get('title') as string;

    if (!listId || !boardId || !listTitle) {
        return { error: "Thiếu thông tin cần thiết." };
    }

    try {
        const { error } = await supabase
            .from('Lists')
            .delete()
            .eq('id', listId);

        if (error) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'DELETE_LIST',
                    metadata: { list_name: listTitle }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho deleteList:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        return { error: `Không thể xóa vĩnh viễn danh sách: ${error.message}` };
    }
}

type ArchiveAllCardsState = ActionState;

export async function archiveAllCardsInList(
    prevState: ArchiveAllCardsState,
    formData: FormData
): Promise<ArchiveAllCardsState> {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
        return {error: "Bạn phải đăng nhập."};
    }

    const listId = formData.get('listId') as string;
    const boardId = formData.get('boardId') as string;
    const listTitle = formData.get('listTitle') as string;

    if (!listId || !boardId || !listTitle) {
        return {error: "Thiếu thông tin cần thiết."};
    }

    try {
        const {error} = await supabase
            .from('Cards')
            .update({archived_at: new Date().toISOString()})
            .eq('list_id', listId)
            .is('archived_at', null);

        if (error) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'ARCHIVE_ALL_CARDS',
                    metadata: {list_name: listTitle}
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho archiveAllCardsInList:", err);
            }
        });

        return {success: true};

    } catch (e) {
        const error = e as Error;
        return {error: `Không thể lưu trữ các thẻ: ${error.message}`};
    }
}

// === CÁC HÀM GET DỮ LIỆU (KHÔNG CẦN DÙNG after()) ===

export async function getArchivedListsByBoard(boardId: string) {
    if (!boardId) {
        console.error("Board ID không được cung cấp.");
        return [];
    }
    const supabase = await createClient();
    try {
        const {data, error} = await supabase
            .from('Lists')
            .select('id, title')
            .eq('board_id', boardId)
            .not('archived_at', 'is', null)
            .order('archived_at', {ascending: false});
        if (error) throw error;
        return data;
    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi lấy danh sách đã lưu trữ:", error.message);
        return [];
    }
}

export async function getArchivedCardsByBoard(boardId: string): Promise<ArchivedCard[]> {
    if (!boardId) {
        console.error("Board ID không được cung cấp.");
        return [];
    }
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from('Cards')
            .select('id, title, Lists(title)')
            .eq('board_id', boardId)
            .not('archived_at', 'is', null)
            .order('archived_at', { ascending: false });
        if (error) throw error;
        return data as ArchivedCard[];
    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi lấy thẻ đã lưu trữ:", error.message);
        return [];
    }
}