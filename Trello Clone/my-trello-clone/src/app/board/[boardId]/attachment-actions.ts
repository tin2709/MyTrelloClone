'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

// --- INTERFACES ---

interface ActionState {
    success?: boolean;
    error?: string;
}

// --- ACTION 1: TẠO TỆP ĐÍNH KÈM DẠNG LINK ---

export async function createAttachment(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập để đính kèm link." };
    }

    const cardId = formData.get('cardId') as string;
    const boardId = formData.get('boardId') as string;
    const cardTitle = formData.get('cardTitle') as string;
    const linkUrl = formData.get('linkUrl') as string; // Thay 'filePath' bằng 'linkUrl'
    const displayName = formData.get('displayName') as string;

    if (!cardId || !boardId || !linkUrl?.trim() || !displayName?.trim()) {
        return { error: "Thiếu Link URL hoặc Tên hiển thị." };
    }

    try {
        // Tác vụ cốt lõi: Lưu link đính kèm vào database
        const { error } = await supabase
            .from('Attachments')
            .insert({
                card_id: cardId,
                board_id: boardId,
                user_id: user.id,
                file_path: linkUrl.trim(), // Lưu URL vào cột file_path
                display_name: displayName.trim(),
                attachment_type: 'link' // Cố định loại là 'link'
            });

        if (error) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'CREATE_ATTACHMENT',
                    metadata: {
                        card_name: cardTitle,
                        attachment_name: displayName.trim()
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho createAttachment:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi tạo đính kèm link:", error.message);
        return { error: "Không thể tạo đính kèm link. Vui lòng thử lại." };
    }
}

// --- ACTION 2: CẬP NHẬT LINK ĐÍNH KÈM ---

export async function updateAttachment(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const attachmentId = formData.get('attachmentId') as string;
    const boardId = formData.get('boardId') as string;
    const newDisplayName = formData.get('newDisplayName') as string;
    const oldDisplayName = formData.get('oldDisplayName') as string;
    const newLinkUrl = formData.get('newLinkUrl') as string; // Thêm trường link mới

    // Phải có ít nhất một trong hai giá trị được cung cấp để cập nhật
    if (!attachmentId || !boardId || (!newDisplayName?.trim() && !newLinkUrl?.trim())) {
        return { error: "Không có thông tin mới để cập nhật." };
    }

    try {
        // Xây dựng đối tượng cập nhật động
        const updateData: { display_name?: string; file_path?: string } = {};
        if (newDisplayName?.trim()) {
            updateData.display_name = newDisplayName.trim();
        }
        if (newLinkUrl?.trim()) {
            updateData.file_path = newLinkUrl.trim();
        }

        // Tác vụ cốt lõi: Cập nhật các trường đã thay đổi
        const { error } = await supabase
            .from('Attachments')
            .update(updateData)
            .eq('id', attachmentId);

        if (error) throw error;

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'UPDATE_ATTACHMENT',
                    metadata: {
                        old_attachment_name: oldDisplayName,
                        new_attachment_name: newDisplayName?.trim() || oldDisplayName
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho updateAttachment:", err);
            }
        });

        return { success: true };

    } catch(e) {
        const error = e as Error;
        console.error("Lỗi khi cập nhật link đính kèm:", error.message);
        return { error: "Không thể cập nhật link đính kèm. Vui lòng thử lại." };
    }
}

// --- ACTION 3: XÓA LINK ĐÍNH KÈM ---

export async function deleteAttachment(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập." };
    }

    const attachmentId = formData.get('attachmentId') as string;
    const boardId = formData.get('boardId') as string;
    const cardTitle = formData.get('cardTitle') as string;
    const displayName = formData.get('displayName') as string;

    if (!attachmentId || !boardId || !displayName) {
        return { error: "Thiếu thông tin để xóa link đính kèm." };
    }

    try {
        // Tác vụ cốt lõi: Xóa bản ghi trong database
        const { error } = await supabase
            .from('Attachments')
            .delete()
            .eq('id', attachmentId);

        if (error) throw error;

        // Đã loại bỏ phần xóa file khỏi Storage vì đây là link

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'DELETE_ATTACHMENT',
                    metadata: {
                        card_name: cardTitle,
                        attachment_name: displayName
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho deleteAttachment:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi xóa link đính kèm:", error.message);
        return { error: `Không thể xóa link đính kèm: ${error.message}` };
    }
}