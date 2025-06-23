// src/app/login/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { BsTrello } from 'react-icons/bs';
import { FcGoogle } from 'react-icons/fc';
import { FaMicrosoft, FaApple, FaSlack } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Link from 'next/link';
import clsx from 'clsx';
import { login, type LoginState } from './actions';

// Nút submit để hiển thị trạng thái loading
function LoginButton() {
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
            {pending ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
    );
}

// Component nút social tái sử dụng
const SocialButton = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <button
        type="button"
        className="w-full flex items-center justify-center py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
    >
        <span className="mr-3">{icon}</span>
        {text}
    </button>
);

export default function LoginPage() {
    const initialState: LoginState = {};
    const [state, formAction] = useFormState(login, initialState);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (state?.error) {
            alert(state.error);
        }
    }, [state]);

    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-50 font-sans">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <BsTrello className="mx-auto text-4xl text-blue-600" />
                    <h1 className="text-xl font-bold text-gray-700 mt-4">
                        Đăng nhập để tiếp tục
                    </h1>
                </div>

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
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Nhập mật khẩu"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </button>
                    </div>

                    <LoginButton />
                </form>

                <div className="text-center text-sm text-gray-500 my-6">
                    Hoặc tiếp tục với:
                </div>

                <div className="space-y-3">
                    <SocialButton icon={<FcGoogle size={22} />} text="Google" />
                    <SocialButton icon={<FaMicrosoft size={20} color="#00A4EF" />} text="Microsoft" />
                    <SocialButton icon={<FaApple size={22} />} text="Apple" />
                    <SocialButton icon={<FaSlack size={20} />} text="Slack" />
                </div>

                <hr className="my-6 border-t border-gray-200" />

                <div className="text-center text-sm">
                    <Link href="/signup" className="text-blue-600 hover:underline">
                        Tạo tài khoản
                    </Link>
                </div>
            </div>
        </main>
    );
}