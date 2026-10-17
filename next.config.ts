import type { NextConfig } from 'next';
const config: NextConfig = {
  agentRules: false,
  output: 'export',
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default config;
