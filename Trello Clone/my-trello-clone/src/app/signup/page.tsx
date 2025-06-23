// src/app/signup/page.tsx

'use client';

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaMicrosoft, FaApple, FaSlack } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/supabaseClient'; // Giữ lại import này
import { AuthError } from '@supabase/supabase-js';
import clsx from 'clsx'; // Thư viện nhỏ để nối class

// Định nghĩa kiểu dữ liệu cho các giá trị của form
// interface SignUpFormValues {
//   email: string;
//   username: string;
//   password: string;
// }

// Component SocialButton được tái sử dụng
const SocialButton = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <button
        type="button"
        className="w-full flex items-center justify-center py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
    >
        <span className="mr-3">{icon}</span>
        {text}
    </button>
);

export default function SignUpPage() {
    // --- Quản lý state thủ công thay cho AntD Form ---
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- Logic xử lý form và Supabase được giữ nguyên ---
    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Ngăn form reload trang
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email, password, options: { data: { full_name: username } }
            });
            if (error) throw error;
            if (data.user?.identities?.length === 0) {
                alert('Xác thực email: Email này đã được đăng ký nhưng chưa xác thực. Vui lòng kiểm tra lại hộp thư đến.');
                return;
            }
            alert('Đăng ký thành công! Chúng tôi đã gửi một liên kết xác thực đến email của bạn.');
            // Reset form
            setEmail(''); setUsername(''); setPassword('');
        } catch (error: unknown) {
            const authError = error as AuthError;
            alert(`Đăng ký thất bại: ${authError.message || 'Đã có lỗi xảy ra.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Đây là div thay thế cho <Flex> của AntD
        <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            {/* Đây là div thay thế cho <Card> của AntD */}
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                {/* Đây là div thay thế cho <Space> và <Typography> của AntD */}
                <div className="text-center space-y-2 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Trello</h1>
                    <p className="text-base text-gray-600">Đăng ký để tiếp tục</p>
                </div>

                {/* Form HTML tiêu chuẩn */}
                <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Nhập tên người dùng"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    {/* Input password với nút ẩn/hiện */}
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>

                    <p className="text-xs text-center text-gray-500 pt-2">
                        Bằng việc đăng ký, tôi chấp nhận{' '}
                        <a href="#" className="text-blue-600 hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-blue-600 hover:underline">Chính sách quyền riêng tư</a>.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className={clsx(
                            "w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-md transition-colors",
                            "hover:bg-blue-700",
                            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                            "disabled:bg-blue-400 disabled:cursor-not-allowed"
                        )}
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng ký'}
                    </button>
                </form>

                {/* Đây là div thay thế cho <Divider> của AntD */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Hoặc tiếp tục với:</span>
                    </div>
                </div>

                {/* Các nút social được giữ nguyên logic */}
                <div className="space-y-3">
                    <SocialButton icon={<FcGoogle size={20} />} text="Google" />
                    <SocialButton icon={<FaMicrosoft size={20} color="#00A4EF" />} text="Microsoft" />
                    <SocialButton icon={<FaApple size={20} />} text="Apple" />
                    <SocialButton icon={<FaSlack size={20} />} text="Slack" />
                </div>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                </div>

                <div className="text-center">
                    <a href="#" className="text-sm text-blue-600 hover:underline">
                        Bạn đã có tài khoản? Đăng nhập
                    </a>
                </div>
            </div>
        </main>
    );
}