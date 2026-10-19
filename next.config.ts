import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  // ponytail: legacy per-link prefetch, same as before 16.3. Enabling it changes every <Link>'s
  // prefetch; adopt via node_modules/next/dist/docs/01-app/02-guides/adopting-partial-prefetching.md.
  partialPrefetching: false,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  images: {
    qualities: [70, 75, 92],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
