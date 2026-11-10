const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@plaza/shared'],
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? 'http://localhost:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${target}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
