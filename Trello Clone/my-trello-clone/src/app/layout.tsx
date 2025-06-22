// src/app/layout.tsx

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import './globals.css'; // File CSS gốc của bạn

const RootLayout = ({ children }: { children: React.ReactNode }) => (
    <html lang="en">
    <body>
    <AntdRegistry>{children}</AntdRegistry>
    </body>
    </html>
);

export default RootLayout;