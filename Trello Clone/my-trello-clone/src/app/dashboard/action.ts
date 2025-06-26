// lib/actions/workspace.ts (ĐÃ SỬA LỖI)
'use server';

// SỬA Ở ĐÂY: Đảm bảo import từ file client của SERVER
import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
// import { cookies } from 'next/headers';

// Định nghĩa kiểu cho trạng thái trả về của action
interface ActionResult {
    success: boolean;
    error?: string | null;
}

export async function createWorkspace(
    prevState: ActionResult, // Bắt buộc cho useFormState
    formData: FormData
): Promise<ActionResult> {
    // const cookieStore = cookies();
    // Bây giờ, `createClient` sẽ là hàm đúng và nhận cookieStore
    const supabase = await createClient(); // <- Thêm await ở đây!

    // 1. Kiểm tra xác thực người dùng
    // Dòng này sẽ không còn báo lỗi nữa
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Bạn phải đăng nhập để thực hiện hành động này.' };
    }

    // 2. Lấy dữ liệu từ form
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    // 3. Validate dữ liệu
    if (!name || name.trim().length === 0) {
        return { success: false, error: 'Tên không gian làm việc không được để trống.' };
    }

    // 4. Gọi hàm RPC đã tạo ở Supabase
    // Dòng này cũng sẽ không còn báo lỗi
    const { error } = await supabase.rpc('create_workspace_and_add_admin', {
        workspace_name: name.trim(),
        workspace_description: description.trim(),
    });

    // 5. Xử lý kết quả
    if (error) {
        console.error('Lỗi RPC create_workspace_and_add_admin:', error);
        return { success: false, error: `Lỗi từ server: ${error.message}` };
    }

    // 6. Làm mới lại dữ liệu của trang dashboard để hiển thị workspace mới
    revalidatePath('/dashboard');

    // 7. Trả về thành công
    return { success: true, error: null };
}