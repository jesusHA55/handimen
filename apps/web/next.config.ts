import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Internal workspace packages ship as TypeScript source and are compiled by Next.
  transpilePackages: ["@handimen/api", "@handimen/config", "@handimen/core", "@handimen/db"],
  // Portability: avoid host-specific features so the Vercel → Cloudflare move is a config change.
  images: { unoptimized: true },
};

export default withNextIntl(nextConfig);
