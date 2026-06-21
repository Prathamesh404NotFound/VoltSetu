import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codecatalyst.chargenest',
  appName: 'VoltSetu',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
