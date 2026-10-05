import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/hr/scanner",
        destination: "/scanner",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
