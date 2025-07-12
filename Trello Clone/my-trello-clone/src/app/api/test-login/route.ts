// src/app/api/test-login/route.ts
import { createClient } from '@/lib/supabase/supabaseServer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { email, password } = await request.json();
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Trả về session để Cypress có thể sử dụng nếu cần
    return NextResponse.json(data.session);
}