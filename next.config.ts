import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
};

const withNextIntl = createNextIntlPlugin(
  './i18n/request.ts'
);
export default withNextIntl(nextConfig);
