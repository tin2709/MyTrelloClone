// src/app/login/actions.ts
'use server';

// Giữ nguyên createClient của bạn. Nếu đường dẫn khác, hãy sửa lại.
import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers'; // Import headers để lấy origin

// Giữ nguyên interface LoginState
export interface LoginState {
    error?: string;
}

// Giữ nguyên hàm login bằng password
export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Vui lòng nhập đầy đủ email và mật khẩu.' };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login Error:', error);
        return { error: 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.' };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
}

// Giữ nguyên hàm logout
export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}

// === THÊM MỚI HÀM NÀY ===
export async function signInWithGoogle() {
    const requestHeaders = await headers();
    // Sau đó, gọi .get() trên đối tượng headers đã được resolve
    const origin = requestHeaders.get('origin');
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // URL này phải được đăng ký trong danh sách "Authorized redirect URIs" trên Google Cloud Console
            redirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        console.error('Google Sign-In Error:', error);
        // Chuyển hướng về trang đăng nhập với thông báo lỗi
        return redirect('/login?error=Could not authenticate with Google');
    }

    // Chuyển hướng người dùng đến URL xác thực của Google
    return redirect(data.url);
}