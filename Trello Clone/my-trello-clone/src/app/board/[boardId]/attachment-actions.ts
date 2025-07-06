'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

// --- INTERFACES ---
interface ActionState {
    success?: boolean;
    error?: string;
}


// --- ACTION: TẠO TỆP ĐÍNH KÈM DẠNG FILE UPLOAD (ĐÃ SỬA ĐỔI) ---
// Action này chỉ lưu metadata vào DB, việc upload file đã được thực hiện ở client.
export async function createFileAttachment(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Bạn phải đăng nhập để đính kèm file." };
    }

    const cardId = formData.get('cardId') as string;
    const boardId = formData.get('boardId') as string;
    const cardTitle = formData.get('cardTitle') as string;
    const filePath = formData.get('filePath') as string; // Nhận đường dẫn từ client
    const displayName = formData.get('displayName') as string; // Nhận tên file từ client

    if (!cardId || !boardId || !filePath || !displayName) {
        return { error: "Thiếu thông tin file đính kèm." };
    }

    try {
        // Tác vụ cốt lõi: Chỉ lưu thông tin vào Database
        const { error: dbError } = await supabase
            .from('Attachments')
            .insert({
                card_id: cardId,
                board_id: boardId,
                user_id: user.id,
                file_path: filePath,
                display_name: displayName,
                attachment_type: 'upload'
            });

        if (dbError) {
            console.error("Lỗi khi lưu attachment vào DB:", dbError);
            throw new Error("Không thể lưu thông tin đính kèm.");
        }

        // Tác vụ phụ: Ghi log và revalidate
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'CREATE_ATTACHMENT',
                    metadata: { card_name: cardTitle, attachment_name: displayName }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi tác vụ nền cho createFileAttachment:", err);
            }
        });

        return { success: true };

    } catch (e) {
        const error = e as Error;
        console.error("Lỗi khi tạo file đính kèm:", error.message);
        return { error: "Không thể tạo file đính kèm. Vui lòng thử lại." };
    }
}

// --- ACTION: TẠO TỆP ĐÍNH KÈM DẠNG LINK (KHÔNG ĐỔI) ---
export async function createLinkAttachment(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: "Bạn phải đăng nhập để đính kèm link." }; }

    const cardId = formData.get('cardId') as string;
    const boardId = formData.get('boardId') as string;
    const cardTitle = formData.get('cardTitle') as string;
    const linkUrl = formData.get('linkUrl') as string;
    const displayName = formData.get('displayName') as string;

    if (!cardId || !boardId || !linkUrl?.trim() || !displayName?.trim()) {
        return { error: "Thiếu Link URL hoặc Tên hiển thị." };
    }
    try {
        const { error } = await supabase
            .from('Attachments')
            .insert({
                card_id: cardId,
                board_id: boardId,
                user_id: user.id,
                file_path: linkUrl.trim(),
                display_name: displayName.trim(),
                attachment_type: 'link'
            });
        if (error) throw error;
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
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho createLinkAttachment:", err);
            }
        });
        return { success: true };
    } catch (e) {
        const error = e as Error;
        return { error: `Không thể tạo đính kèm link: ${error.message}` };
    }
}

// --- ACTION: CẬP NHẬT ĐÍNH KÈM (KHÔNG ĐỔI) ---
export async function updateAttachment(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: "Bạn phải đăng nhập." }; }

    const attachmentId = formData.get('attachmentId') as string;
    const boardId = formData.get('boardId') as string;
    const newDisplayName = formData.get('newDisplayName') as string | null;
    const newLinkUrl = formData.get('newLinkUrl') as string | null;
    const oldDisplayName = formData.get('oldDisplayName') as string;

    if (!attachmentId || !boardId || (!newDisplayName?.trim() && !newLinkUrl?.trim())) {
        return { error: "Không có thông tin mới để cập nhật." };
    }
    try {
        const { data: currentAttachment, error: fetchError } = await supabase
            .from('Attachments').select('attachment_type').eq('id', attachmentId).single();

        if (fetchError || !currentAttachment) {
            throw new Error("Không tìm thấy tệp đính kèm.");
        }

        const updateData: { display_name?: string; file_path?: string } = {};
        if (newDisplayName?.trim()) { updateData.display_name = newDisplayName.trim(); }

        if (currentAttachment.attachment_type === 'link' && newLinkUrl?.trim()) {
            updateData.file_path = newLinkUrl.trim();
        } else if (currentAttachment.attachment_type === 'upload' && newLinkUrl?.trim()) {
            return { error: "Không thể thay đổi đường dẫn của một file đã được upload." };
        }

        if (Object.keys(updateData).length === 0) {
            return { error: "Không có thông tin hợp lệ để cập nhật." };
        }

        const { error } = await supabase.from('Attachments').update(updateData).eq('id', attachmentId);
        if (error) throw error;
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'UPDATE_ATTACHMENT',
                    metadata: {
                        old_attachment_name: oldDisplayName,
                        new_attachment_name: updateData.display_name || oldDisplayName
                    }
                });
                revalidatePath(`/board/${boardId}`);
            } catch (err) {
                console.error("[AFTER] Lỗi khi thực hiện tác vụ nền cho updateAttachment:", err);
            }
        });
        return { success: true };
    } catch (e) {
        const error = e as Error;
        return { error: `Không thể cập nhật đính kèm: ${error.message}` };
    }
}

// --- ACTION: XÓA ĐÍNH KÈM (KHÔNG ĐỔI) ---
export async function deleteAttachment(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: "Bạn phải đăng nhập." }; }

    const attachmentId = formData.get('attachmentId') as string;
    const boardId = formData.get('boardId') as string;
    const cardTitle = formData.get('cardTitle') as string;
    const bucketName = 'attachments';

    if (!attachmentId || !boardId) {
        return { error: "Thiếu thông tin để xóa đính kèm." };
    }
    try {
        const { data: attachment, error: fetchError } = await supabase
            .from('Attachments').select('file_path, attachment_type, display_name')
            .eq('id', attachmentId).single();

        if (fetchError || !attachment) { throw new Error("Không tìm thấy tệp đính kèm."); }

        if (attachment.attachment_type === 'upload') {
            const { error: storageError } = await supabase.storage
                .from(bucketName).remove([attachment.file_path]);
            if (storageError) { console.error("Lỗi xóa file Storage:", storageError.message); }
        }

        const { error: dbError } = await supabase.from('Attachments').delete().eq('id', attachmentId);
        if (dbError) throw dbError;
        after(async () => {
            try {
                await supabase.from('Activities').insert({
                    user_id: user.id,
                    board_id: boardId,
                    action_type: 'DELETE_ATTACHMENT',
                    metadata: {
                        card_name: cardTitle,
                        attachment_name: attachment.display_name
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
        return { error: `Không thể xóa đính kèm: ${error.message}` };
    }
}