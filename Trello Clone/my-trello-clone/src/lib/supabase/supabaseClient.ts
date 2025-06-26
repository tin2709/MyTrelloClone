// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
// 1. Import kiểu 'Database' từ tệp types của bạn
import type { Database } from '@/lib/type'; // <-- THÊM DÒNG NÀY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 2. Thêm <Database> vào hàm createClient
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); // <-- THÊM <Database> VÀO ĐÂY