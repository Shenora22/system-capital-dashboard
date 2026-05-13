import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/brand-kit/assets/:path*",
        destination: "/marketing/assets/brand-kit/:path*",
      },
      {
        source: "/carousels/system-capital/:path*",
        destination: "/marketing/carousels/system-capital/:path*",
      },
    ];
  },
};

export default nextConfig;
