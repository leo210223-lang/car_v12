import type { NextConfig } from "next";

/** 將 Next 同源 /api/v1/* 轉到 Express（與 getApiBaseUrl 未設 NEXT_PUBLIC_API_URL 時搭配） */
function backendRewriteDestination(): string | null {
  const raw = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (raw) {
    const base = raw.replace(/\/+$/, "");
    return /\/api\/v\d+$/i.test(base) ? base : `${base}/api/v1`;
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:3001/api/v1";
  }
  // Production fallback：避免漏設環境變數時 /api/v1/* 直接 404
  return "https://car-v12.onrender.com/api/v1";
}

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    const dest = backendRewriteDestination();
    return [{ source: "/api/v1/:path*", destination: `${dest}/:path*` }];
  },
  experimental: {
    proxyTimeout: 30_000,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
