// src/middleware.ts

import { type NextRequest } from 'next/server';
// SỬA Ở ĐÂY: Import từ file helper middleware mới
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // Hàm createClient này bây giờ là hàm ĐÚNG cho middleware
    // Nó trả về một object đồng bộ, không cần 'await'
    const { supabase, response } = createClient(request);

    // Lấy thông tin session
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const { pathname } = request.nextUrl;

    // Nếu người dùng chưa đăng nhập và đang cố truy cập dashboard
    if (!session && pathname.startsWith('/dashboard')) {
        // Chuyển hướng họ về trang login
        // LƯU Ý: Không dùng NextResponse.redirect nữa, vì response đã được quản lý
        const loginUrl = new URL('/login', request.url);
        return Response.redirect(loginUrl);
    }

    // Nếu người dùng đã đăng nhập và đang cố truy cập trang login/signup
    if (session && (pathname === '/login' || pathname === '/signup')) {
        // Chuyển hướng họ về trang dashboard
        const dashboardUrl = new URL('/dashboard', request.url);
        return Response.redirect(dashboardUrl);
    }

    // Trả về response đã được cập nhật với các cookie (nếu có)
    // Đây là bước quan trọng để giữ cho session được đồng bộ
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};