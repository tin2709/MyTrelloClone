'use server';

import { createClient } from '@/lib/supabase/supabaseServer';

// Kiểu dữ liệu cho trạng thái của form
export interface ForgotPasswordState {
    success?: boolean;
    error?: string;
}

// Server Action để gửi email đặt lại mật khẩu
export async function resetPassword(
    prevState: ForgotPasswordState,
    formData: FormData,
): Promise<ForgotPasswordState> {
    const email = formData.get('email') as string;

    if (!email || !email.includes('@')) {
        return { error: 'Vui lòng nhập một địa chỉ email hợp lệ.' };
    }

    const supabase = await createClient();

    // -- ĐIỂM QUAN TRỌNG NHẤT LÀ ĐÂY --
    // Chúng ta xây dựng URL đầy đủ để Supabase biết chính xác nơi cần chuyển hướng đến.
    // URL này PHẢI khớp với một trong các URL bạn đã thêm vào "Redirect URLs" ở Bước 1.
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`;

    // Gọi hàm của Supabase với tùy chọn `redirectTo` đã được chỉ định
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
    });

    if (error) {
        console.error('Password Reset Error:', error);
        // Trả về thông báo lỗi chung chung để không tiết lộ email nào tồn tại trong hệ thống
        return { error: 'Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.' };
    }

    // Nếu không có lỗi, trả về trạng thái thành công để UI hiển thị thông báo.
    return { success: true };
}