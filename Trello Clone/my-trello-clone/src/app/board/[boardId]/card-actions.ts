'use server';

// Sử dụng đúng client cho server, đảm bảo bạn đã tạo kiểu cho nó
import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server'; // Thêm import after()

// --- INTERFACES ---

interface ActionState {
    success?: boolean;
    error?: string;
}

interface CreateCardState extends ActionState {
    card?: { id: string; title: string; };
}

// --- ACTION 1: TẠO THẺ MỚI ---

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

        // Tác vụ cốt lõi: Tạo thẻ mới
        const { data: newCard, error } = await supabase
            .from('Cards')
            .insert({
                title: title.trim(),
                list_id: listId,
                position: newPosition,
                board_id: boardId,
            })
            .select('id, title')
            .single();

        if (error || !newCard) throw error || new Error("Không thể tạo thẻ.");

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
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
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho createCard:", err);
            }
        });

        // Trả về thành công ngay lập tức
        return { success: true, card: newCard };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi tạo thẻ:", error.message);
        return { error: "Không thể tạo thẻ. Vui lòng thử lại." };
    }
}


// --- ACTION 2: CẬP NHẬT MÔ TẢ CỦA THẺ ---

export async function updateCardDescription(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const cardId = formData.get('cardId') as string;
    const boardId = formData.get('boardId') as string;
    const description = formData.get('description') as string;

    try {
        // Tác vụ cốt lõi: Cập nhật mô tả
        const { error } = await supabase
            .from('Cards')
            .update({ description: description })
            .eq('id', cardId);

        if (error) throw error;

        // Tác vụ phụ: Revalidate
        after(() => {
            try {
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi revalidate sau khi cập nhật mô tả thẻ:", err);
            }
        });

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

    // Tác vụ cốt lõi: Cập nhật vị trí và danh sách
    const { error } = await supabase
        .from('Cards')
        .update({
            list_id: newListId,
            position: newPosition,
        })
        .eq('id', cardId);

    if (error) {
        console.error("Lỗi khi cập nhật thứ tự thẻ:", error);
    }

    // Tác vụ phụ: Revalidate
    after(() => {
        try {
            revalidatePath(`/board/${boardId}`);
        } catch (err) {
            console.error("[AFTER] Lỗi khi revalidate sau khi cập nhật thứ tự thẻ:", err);
        }
    });
}

// Hàm này là một tác vụ phụ, không cần after() bên trong nó.
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

// --- ACTION 4: KHÔI PHỤC THẺ ---

// --- ACTION 4: KHÔI PHỤC THẺ (ĐÃ SỬA LỖI SCOPE) ---

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

    // SỬA LỖI: Khai báo biến ở scope cao hơn để 'after' có thể truy cập
    let listIdForLogging: string | null = null;

    try {
        // Lấy thông tin list_id của thẻ trước khi cập nhật
        const { data: cardData, error: cardFetchError } = await supabase
            .from('Cards')
            .select('list_id')
            .eq('id', cardId)
            .single();

        if (cardFetchError || !cardData) {
            throw cardFetchError || new Error("Không tìm thấy thẻ để lấy thông tin danh sách.");
        }

        // Gán giá trị vào biến đã khai báo ở trên
        listIdForLogging = cardData.list_id;

        // Tác vụ cốt lõi: Khôi phục thẻ
        const { error: updateError } = await supabase
            .from('Cards')
            .update({ archived_at: null })
            .eq('id', cardId);

        if (updateError) throw updateError;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            // Chỉ thực hiện nếu có listId
            if (listIdForLogging) {
                try {
                    // Lấy tên danh sách từ listId đã được truyền vào closure
                    const { data: listData } = await supabase.from('Lists').select('title').eq('id', listIdForLogging).single();

                    await supabase.from('Activities').insert({
                        user_id: user.id,
                        board_id: boardId,
                        action_type: 'RESTORE_CARD',
                        metadata: {
                            card_name: cardTitle,
                            list_name: listData?.title || 'một danh sách'
                        }
                    });
                    revalidatePath(`/board/${boardId}`);
                } catch (err) {
                    console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho restoreCard:", err);
                }
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi khôi phục thẻ:", error.message);
        return { error: `Không thể khôi phục thẻ: ${error.message}` };
    }
}

// --- ACTION 5: XÓA VĨNH VIỄN THẺ ---

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
        // Tác vụ cốt lõi: Xóa thẻ
        const { error } = await supabase
            .from('Cards')
            .delete()
            .eq('id', cardId);

        if (error) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'DELETE_CARD',
                    metadata: { card_name: cardTitle }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho deleteCard:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi xóa thẻ:", error.message);
        return { error: `Không thể xóa thẻ: ${error.message}` };
    }
}

// --- ACTION 6: ĐÁNH DẤU HOÀN THÀNH/CHƯA HOÀN THÀNH ---

export async function markCard(
    cardId: string,
    boardId: string,
    cardTitle: string,
    currentCompletedAt: string | null
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
        const newCompletedAt = currentCompletedAt ? null : new Date().toISOString();

        // Tác vụ cốt lõi: Cập nhật thẻ
        const { error } = await supabase
            .from('Cards')
            .update({ completed_at: newCompletedAt })
            .eq('id', cardId);

        if (error) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                const completionStatus = newCompletedAt ? 'completed' : 'uncompleted';
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'MARK_CARD',
                    metadata: {
                        card_name: cardTitle,
                        marked_as: completionStatus
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho markCard:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi đánh dấu thẻ:", error.message);
        return { error: `Không thể cập nhật trạng thái thẻ: ${error.message}` };
    }
}
export async function updateCardDates(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const cardId = formData.get('cardId') as string;
    const boardId = formData.get('boardId') as string;
    const cardTitle = formData.get('cardTitle') as string;
    const startedAt = formData.get('started_at') as string | null;
    const duedAt = formData.get('dued_at') as string | null;

    if (!cardId || !boardId || !cardTitle) {
        return { error: "Thiếu thông tin cần thiết để cập nhật ngày." };
    }

    try {
        // Tác vụ cốt lõi: Cập nhật ngày bắt đầu và ngày kết thúc
        // Nếu giá trị là một chuỗi rỗng, nó sẽ được chuyển thành null để xóa ngày trong DB
        const { error } = await supabase
            .from('Cards')
            .update({
                started_at: startedAt || null,
                dued_at: duedAt || null,
            })
            .eq('id', cardId);

        if (error) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'UPDATE_CARD_DATES',
                    metadata: {
                        card_name: cardTitle
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho updateCardDates:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi cập nhật ngày của thẻ:", error.message);
        return { error: "Không thể cập nhật ngày. Vui lòng thử lại." };
    }
}