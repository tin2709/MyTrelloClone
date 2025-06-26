// lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr';
// 1. Import kiểu 'Database' từ tệp types của bạn
import type { Database } from '@/lib/type'; // <-- THÊM DÒNG NÀY

export const createClient = () =>
    // 2. Thêm <Database> vào hàm createBrowserClient
    createBrowserClient<Database>( // <-- THÊM <Database> VÀO ĐÂY
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );