import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deployed as a regular Next.js app (e.g. on Vercel) so the server route
  // /api/ipfs/event-metadata exists. `output: 'export'` produced static files only, which returned 404 for it.
  images: {
    unoptimized: true

  },
  basePath: "",
  assetPrefix: '/',
  trailingSlash: true
};

export default nextConfig;
