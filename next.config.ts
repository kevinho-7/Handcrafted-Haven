/* @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "placehold.co",
    },
    {
      protocol: "https",
      hostname: "hglnbjxvpxtjcwkj.public.blob.vercel-storage.com",
    },
  ],
}
};

module.exports = nextConfig;
