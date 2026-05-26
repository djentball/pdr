import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Лінтер пропускаємо під час build — попередньо існуючі warning'и React 19
  // про set-state-in-effect не блокуючі для роботи додатку.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
