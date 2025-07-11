// next.config.ts (hoặc .js)

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Đây là nơi bạn đặt các tùy chọn cấu hình của Next.js
    // Ví dụ: reactStrictMode, images, redirects, ...
    reactStrictMode: true,

    // Đây là cách để tùy chỉnh cấu hình Webpack
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // 'config' là đối tượng cấu hình Webpack hiện tại của Next.js
        // Bạn có thể sửa đổi nó ở đây.

        // Ví dụ: Thêm một quy tắc để xử lý các file SVG
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
        });

        // Quan trọng: Luôn luôn trả về đối tượng config đã được sửa đổi
        return config;
    },

    // Lưu ý: KHÔNG CÓ tùy chọn `devServer` ở đây.
    // devServer: { // <--- DÒNG NÀY SẼ GÂY LỖI VÀ KHÔNG CÓ TÁC DỤNG
    //   historyApiFallback: true,
    // },
};

export default nextConfig;