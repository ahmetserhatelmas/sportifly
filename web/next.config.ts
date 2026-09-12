import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Üst klasördeki Expo package-lock.json ile karışmasın.
  turbopack: { root: __dirname },
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
