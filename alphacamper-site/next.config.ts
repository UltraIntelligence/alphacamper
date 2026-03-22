import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [100, 75],
  },
  experimental: {
    turbopack: {
      root: "/Users/ryan/Code/Alphacamper/alphacamper-site",
    },
  },
};

export default nextConfig;
