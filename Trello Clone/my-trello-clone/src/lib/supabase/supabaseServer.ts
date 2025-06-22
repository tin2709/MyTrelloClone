// lib/supabase/server.ts

// 1. Import các thành phần cần thiết
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 2. Tạo hàm createClient
// Hàm này không cần nhận tham số nữa, nó tự xử lý mọi thứ bên trong.
export const createClient = async () => {
    const cookieStore = await cookies(); // <- dùng await

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // ignore error
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch {
                        // ignore error
                    }
                },
            },
        }
    );
};
