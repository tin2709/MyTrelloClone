// src/middleware.ts

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // Phần CSP không thay đổi
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http: 'unsafe-inline';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

    // Bước 1: Lấy supabase client VÀ đối tượng response ban đầu
    const { supabase, response } = createClient(request);

    // Bước 2: Lấy session. Bước này rất quan trọng, nếu có `code` trong URL,
    // Supabase sẽ trao đổi nó lấy session và đặt cookie vào đối tượng `response`.
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const { pathname } = request.nextUrl;

    // ----- SỬA LỖI Ở ĐÂY -----
    // Logic chuyển hướng khi chưa/đã đăng nhập, nhưng BẢO TOÀN COOKIE

    if (!session && pathname.startsWith('/dashboard')) {
        const loginUrl = new URL('/login', request.url);
        // THAY ĐỔI: Sử dụng NextResponse.redirect nhưng truyền vào headers của response hiện có.
        // Việc này tạo ra một redirect response nhưng vẫn giữ lại các header quan trọng
        // như 'Set-Cookie' mà Supabase vừa tạo.
        return NextResponse.redirect(loginUrl, {
            headers: response.headers,
        });
    }

    if (session && (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password')) {
        const dashboardUrl = new URL('/dashboard', request.url);
        // THAY ĐỔI: Áp dụng logic tương tự ở đây.
        return NextResponse.redirect(dashboardUrl, {
            headers: response.headers,
        });
    }

    // Phần CSP không thay đổi
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    response.headers.set(
        'Content-Security-Policy',
        cspHeader.replace(/\s{2,}/g, ' ').trim()
    );

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
        headers: response.headers,
    });
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};