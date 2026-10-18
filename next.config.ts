import type { NextConfig } from 'next';
const config: NextConfig = {
  agentRules: false,
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default config;
