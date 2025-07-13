// src/app/board/[boardId]/import-actions.ts
'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';

type ImportMode = 'merge' | 'replace';

/**
 * Hàm trợ giúp để xác thực cấu trúc của đối tượng JSON.
 * Phiên bản này được nâng cấp để kiểm tra các trường chi tiết hơn.
 * @param data - Dữ liệu đã được phân tích từ JSON.
 * @returns { { isValid: boolean; error?: string } } - Kết quả xác thực.
 */
function validateJsonStructure(data: any): { isValid: boolean; error?: string } {
    if (!data || typeof data !== 'object' || !Array.isArray(data.lists)) {
        return { isValid: false, error: "Tệp JSON phải có một thuộc tính 'lists' là một mảng." };
    }

    for (const list of data.lists) {
        if (!list || typeof list !== 'object' || typeof list.title !== 'string' || list.title.trim() === '') {
            return { isValid: false, error: "Mỗi danh sách phải có 'title' là chuỗi không rỗng." };
        }
        if (typeof list.position !== 'number') {
            return { isValid: false, error: `Danh sách "${list.title}" thiếu thuộc tính 'position' hợp lệ.` };
        }

        if ('cards' in list && list.cards) {
            if (!Array.isArray(list.cards)) {
                return { isValid: false, error: `Thuộc tính 'cards' trong danh sách "${list.title}" phải là một mảng.` };
            }

            for (const card of list.cards) {
                if (!card || typeof card !== 'object' || typeof card.title !== 'string' || card.title.trim() === '') {
                    return { isValid: false, error: `Một thẻ trong danh sách "${list.title}" thiếu 'title' hợp lệ.` };
                }
                if (typeof card.position !== 'number') {
                    return { isValid: false, error: `Thẻ "${card.title}" thiếu thuộc tính 'position' hợp lệ.` };
                }
            }
        }
    }

    return { isValid: true };
}

/**
 * Action chính để nhập dữ liệu từ một chuỗi JSON vào một bảng.
 * @param boardId - ID của bảng đích.
 * @param jsonData - Chuỗi nội dung của file JSON.
 * @param mode - Chế độ nhập: 'merge' (giữ lại và thêm mới) hoặc 'replace' (xóa và thay thế).
 */
export async function importBoardData(boardId: string, jsonData: string, mode: ImportMode) {
    const supabase = await createClient();

    // 1. Xác thực người dùng
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Bạn phải đăng nhập để thực hiện hành động này." };
    }

    // 2. Phân tích cú pháp chuỗi JSON
    let parsedData;
    try {
        parsedData = JSON.parse(jsonData);
    } catch (error) {
        console.error("Lỗi khi phân tích cú pháp JSON:", error);
        return { success: false, error: "Tệp được tải lên không phải là file JSON hợp lệ." };
    }

    // 3. Xác thực cấu trúc của dữ liệu
    const validationResult = validateJsonStructure(parsedData);
    if (!validationResult.isValid) {
        return { success: false, error: validationResult.error };
    }

    try {
        // 4. Xử lý theo chế độ (mode)
        let listPositionOffset = 0;
        if (mode === 'replace') {
            // Xóa tất cả các danh sách cũ thuộc về bảng này.
            // Giả sử CSDL đã thiết lập ON DELETE CASCADE cho khóa ngoại từ Cards -> Lists
            await supabase.from('Lists').delete().eq('board_id', boardId);
        } else { // mode === 'merge'
            // Lấy vị trí lớn nhất của danh sách hiện có để chèn nối tiếp
            const { data: lastList } = await supabase
                .from('Lists')
                .select('position')
                .eq('board_id', boardId)
                .order('position', { ascending: false })
                .limit(1)
                .single();

            if (lastList) {
                listPositionOffset = lastList.position + 1;
            }
        }

        // 5. Chèn dữ liệu mới
        // Sắp xếp các danh sách theo vị trí để đảm bảo thứ tự chèn đúng
        const sortedLists = parsedData.lists.sort((a: any, b: any) => a.position - b.position);

        for (const listData of sortedLists) {
            // Chèn danh sách mới và lấy lại ID
            const { data: newList, error: listInsertError } = await supabase
                .from('Lists')
                .insert({
                    title: listData.title.trim(),
                    board_id: boardId,
                    position: listData.position + listPositionOffset, // Giữ lại vị trí tương đối
                })
                .select('id')
                .single();

            if (listInsertError) throw new Error(`Không thể chèn danh sách "${listData.title}": ${listInsertError.message}`);

            // Nếu danh sách có thẻ, chuẩn bị và chèn các thẻ đó
            if (listData.cards && listData.cards.length > 0) {
                const sortedCards = listData.cards.sort((a: any, b: any) => a.position - b.position);

                const cardsToInsert = sortedCards.map((cardData: any) => ({
                    title: cardData.title.trim(),
                    description: cardData.description || null,
                    list_id: newList.id, // Sử dụng ID của danh sách vừa tạo
                    board_id: boardId,
                    position: cardData.position, // Giữ lại vị trí tương đối của thẻ trong danh sách
                    dued_at: cardData.dued_at || null,
                    started_at: cardData.started_at || null,
                    completed_at: cardData.completed_at || null,
                }));

                const { error: cardInsertError } = await supabase.from('Cards').insert(cardsToInsert);
                if (cardInsertError) throw new Error(`Không thể chèn các thẻ cho danh sách "${listData.title}": ${cardInsertError.message}`);
            }
        }

        // 6. Revalidate path để client thấy thay đổi và trả về thành công
        revalidatePath(`/board/${boardId}`);
        return { success: true, message: "Nhập dữ liệu thành công!" };

    } catch (error) {
        console.error("Lỗi trong quá trình nhập dữ liệu:", error);
        const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
        return { success: false, error: `Lỗi khi nhập dữ liệu: ${errorMessage}` };
    }
}