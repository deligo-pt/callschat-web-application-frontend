import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/business/channels/:path*",
        destination: "/business/chats",
        permanent: false,
      },
      {
        source: "/business/dashboard",
        destination: "/business/chats",
        permanent: false,
      },
      {
        source: "/profile/dashboard",
        destination: "/profile/edit",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
