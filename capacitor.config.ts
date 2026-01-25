import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a325e6c326d5427bb882a874fb37c73b',
  appName: 'مساعدك الشخصي',
  webDir: 'dist',
  // للتطوير فقط - قم بإزالة التعليق لتفعيل Hot Reload
  // server: {
  //   url: 'https://a325e6c3-26d5-427b-b882-a874fb37c73b.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      backgroundColor: '#0f0d1a',
      showSpinner: true,
      spinnerColor: '#22d3ee',
      splashFullScreen: true,
      splashImmersive: true,
      androidSplashResourceName: 'splash',
      iosSpinnerStyle: 'large',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#22d3ee',
      sound: 'beep.wav',
    },
  },
};

export default config;
