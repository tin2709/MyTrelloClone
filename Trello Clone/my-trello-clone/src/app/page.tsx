// src/app/page.tsx

// Bước 1: Import các công cụ cần thiết từ Prismic và các slices bạn đã tạo
import { createClient } from "@/prismicio";
import { SliceZone } from "@prismicio/react";
import { components } from "@/slices";
import React from "react";

// Bước 2: Biến component này thành một Server Component bằng từ khóa "async"
export default async function Page() {

  // Bước 3: Tạo một client để có thể "nói chuyện" với Prismic
  const client = createClient();

  // Bước 4: Gọi và đợi (await) dữ liệu từ Prismic.
  // "getSingle" được dùng vì 'homepage' là một "Single Type".
  const page = await client.getSingle("homepage");

  // Bước 5: Render component <SliceZone>
  // Nó sẽ nhận mảng các slices từ dữ liệu của page
  // và tự động render các component tương ứng (HeroSection)
  return <SliceZone slices={page.data.slices} components={components} />;
}