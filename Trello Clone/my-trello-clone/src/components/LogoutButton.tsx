// src/components/LogoutButton.tsx
'use client';

import { logout } from '@/app/login/actions';

export default function LogoutButton() {
    return (
        <form action={logout}>
            <button
                type="submit"
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
            >
                Đăng xuất
            </button>
        </form>
    );
}