import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mystarquest.app',
  appName: 'MyStarQuest',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      providers: ['google.com'],
    },
  },
}

export default config
