// lib/supabase/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/type'; // <-- THÊM DÒNG NÀY

export const createClient = (request: NextRequest) => {
    // Tạo một NextResponse ban đầu. Đây là cách để chúng ta có thể đọc và ghi cookie.
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Nếu chúng ta đang set một cookie, hãy thêm nó vào headers của response
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    // Và cập nhật lại response
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    // Tương tự, nếu xóa cookie
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // Rất quan trọng: trả về cả supabase client và response đã được cập nhật
    return { supabase, response }
}