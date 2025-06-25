// src/app/auth/reset-password/actions.ts

'use server';

import { createClient } from '@/lib/supabase/supabaseServer'; // Đổi tên tệp cho đúng
import { redirect } from 'next/navigation';

export interface UpdatePasswordState {
    error?: string;
}

export async function updatePassword(
    prevState: UpdatePasswordState,
    formData: FormData,
): Promise<UpdatePasswordState> {
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        return { error: 'Mật khẩu xác nhận không khớp.' };
    }

    if (!password || password.length < 6) {
        return { error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
    }

    const supabase = await createClient();

    // Bước 1: Cập nhật mật khẩu người dùng
    const { error: updateError } = await supabase.auth.updateUser({
        password: password,
    });

    if (updateError) {
        console.error('Update Password Error:', updateError);
        return { error: 'Không thể cập nhật mật khẩu. Phiên của bạn có thể đã hết hạn hoặc không hợp lệ.' };
    }

    // ===== BƯỚC THAY ĐỔI QUAN TRỌNG =====
    // Bước 2: Đăng xuất người dùng khỏi phiên tạm thời
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
        console.error('Sign Out Error after password reset:', signOutError);
        // Nếu không đăng xuất được, vẫn nên chuyển hướng để họ đăng nhập lại
    }
    // =====================================

    // Bước 3: Chuyển hướng đến trang đăng nhập
    // Thêm một query param để có thể hiển thị thông báo thành công nếu muốn
    redirect('/login?reset=success');
}