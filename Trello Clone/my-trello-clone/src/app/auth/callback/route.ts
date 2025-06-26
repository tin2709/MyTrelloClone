// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Đăng nhập thành công, chuyển hướng đến trang dashboard
            return NextResponse.redirect('/dashboard');
        }
    }

    // Nếu có lỗi hoặc không có code, chuyển hướng về trang đăng nhập với thông báo lỗi
    console.error('Authentication callback error');
    return NextResponse.redirect(`${origin}/login?error=Authentication failed`);
}