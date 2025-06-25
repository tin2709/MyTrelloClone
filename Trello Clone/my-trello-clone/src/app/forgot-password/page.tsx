// src/app/forgot-password/page.tsx
'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import clsx from 'clsx';
import { BsTrello } from 'react-icons/bs';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { resetPassword, type ForgotPasswordState } from './action';

// Component nút bấm, tự động hiển thị trạng thái "loading"
function ResetButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={clsx(
                'w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-md transition-colors',
                'hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                'disabled:bg-blue-400 disabled:cursor-not-allowed',
            )}
        >
            {pending ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
        </button>
    );
}

export default function ForgotPasswordPage() {
    const initialState: ForgotPasswordState = {};
    const [state, formAction] = useFormState(resetPassword, initialState);

    // Giao diện khi gửi email thành công
    if (state.success) {
        return (
            <main className="flex items-center justify-center min-h-screen bg-gray-50 font-sans">
                <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center">
                    <IoMdCheckmarkCircleOutline className="mx-auto text-6xl text-green-500 mb-6" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-3">
                        Kiểm tra email của bạn
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến địa chỉ email của bạn.
                        Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                    </p>
                    <Link
                        href="/login"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Quay lại trang đăng nhập
                    </Link>
                </div>
            </main>
        );
    }

    // Giao diện form mặc định
    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-50 font-sans">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <BsTrello className="mx-auto text-4xl text-blue-600" />
                    <h1 className="text-xl font-bold text-gray-700 mt-4">
                        Không thể đăng nhập?
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Nhập email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để lấy lại quyền truy cập vào tài khoản.
                    </p>
                </div>

                {/* Hiển thị lỗi nếu có */}
                {state.error && (
                    <div className="mb-4 p-3 text-sm text-red-800 bg-red-100 rounded-md text-center" role="alert">
                        {state.error}
                    </div>
                )}

                <form action={formAction} className="space-y-6">
                    <div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Nhập email"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <ResetButton />
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