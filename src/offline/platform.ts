import { Capacitor } from '@capacitor/core'

export const isAndroidOffline = () => Capacitor.getPlatform() === 'android'
