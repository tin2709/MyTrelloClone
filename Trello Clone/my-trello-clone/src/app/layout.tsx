// src/app/layout.tsx

import React from 'react';
import './globals.css'; // Giữ lại file CSS chung của bạn

const RootLayout = ({ children }: { children: React.ReactNode }) => (
    <html lang="en">
    <body>
    {/* Trả về children trực tiếp, không cần bọc trong bất kỳ thứ gì của AntD */}
    {children}
    </body>
    </html>
);

export default RootLayout;