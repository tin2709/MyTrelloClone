// src/app/layout.tsx
import { Toaster } from 'react-hot-toast';

import React from 'react';
import './globals.css'; // Giữ lại file CSS chung của bạn

const RootLayout = ({ children }: { children: React.ReactNode }) => (
    <html lang="en">
    <body>
    {/* Trả về children trực tiếp, không cần bọc trong bất kỳ thứ gì của AntD */}
    {children}
    <Toaster // Thêm dòng này
        position="bottom-right"
        toastOptions={{
            duration: 4000,
        }}
    />
    </body>
    </html>
);

export default RootLayout;