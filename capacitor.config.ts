import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codecatalyst.chargenest',
  appName: 'ChargeNest',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
