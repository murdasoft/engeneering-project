/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: "/", destination: "/demo", permanent: false },
    ];
  },
};
module.exports = nextConfig;
