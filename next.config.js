/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Important: return the modified config
    config.module.rules.push({
      test: /\.mjs$/,
      enforce: 'pre',
      use: ['source-map-loader'],
    });
    return config;
  },
  eslint: {
    // 指定要检查的文件
    dirs: ['pages', 'components', 'lib', 'src']
  }
};

module.exports = nextConfig;
