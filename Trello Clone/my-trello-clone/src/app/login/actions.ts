// src/app/login/actions.ts
'use server';

import { createClient } from '@/lib/supabase/supabaseServer';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface LoginState {
    error?: string;
}

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

    // Revalidate toàn bộ layout để cập nhật trạng thái header/user
    revalidatePath('/', 'layout');
    // Chuyển hướng đến trang dashboard
    redirect('/dashboard');
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}