'use client';

import React, { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updatePassword, type UpdatePasswordState } from './action';
import Link from 'next/link';
import clsx from 'clsx';
import { BsTrello } from 'react-icons/bs';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={clsx(
                "w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-md transition-colors",
                "hover:bg-blue-700",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                "disabled:bg-blue-400 disabled:cursor-not-allowed"
            )}
        >
            {pending ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
        </button>
    );
}

export default function ResetPasswordPage() {
    const initialState: UpdatePasswordState = {};
    const [state, formAction] = useFormState(updatePassword, initialState);
    const searchParams = useSearchParams();

    // 🔁 FIX CHÍNH: Xử lý `code` từ URL (PKCE flow)
    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            const supabase = createClient();

            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (error) {
                    console.error('Lỗi khi thiết lập phiên:', error.message);
                } else {
                    // Tạo session thành công -> reload lại để kích hoạt SSR cookies
                    window.location.replace('/auth/reset-password');
                }
            });
        }
    }, [searchParams]);

    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-50 font-sans">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <BsTrello className="mx-auto text-4xl text-blue-600" />
                    <h1 className="text-xl font-bold text-gray-700 mt-4">
                        Đặt lại mật khẩu của bạn
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Nhập mật khẩu mới mạnh và dễ nhớ.
                    </p>
                </div>

                {state.error && (
                    <div className="mb-4 p-3 text-sm text-red-800 bg-red-100 rounded-md text-center" role="alert">
                        {state.error}
                    </div>
                )}

                <form action={formAction} className="space-y-6">
                    <div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="Nhập mật khẩu mới"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            placeholder="Xác nhận mật khẩu mới"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <SubmitButton />
                </form>

                <hr className="my-6 border-t border-gray-200" />

                <div className="text-center text-sm">
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Quay lại trang đăng nhập
                    </Link>
                </div>
            </div>
        </main>
    );
}
