import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a325e6c326d5427bb882a874fb37c73b',
  appName: 'مساعدك الشخصي',
  webDir: 'dist',
  server: {
    url: 'https://a325e6c3-26d5-427b-b882-a874fb37c73b.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f0d1a',
      showSpinner: false,
    },
  },
};

export default config;
