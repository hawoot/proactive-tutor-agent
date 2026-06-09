// Registers this device for push and hands the Expo token to the backend.
// In Expo Go this works only partially (see HOWTO section 5); a dev build gets real push.
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api, getConfig } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush() {
  if (!Device.isDevice) return { ok: false, msg: 'Push needs a physical device.' };
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return { ok: false, msg: 'Permission denied.' };

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const { studentId } = await getConfig();
    await api.registerDevice(studentId, token);
    return { ok: true, msg: 'Push registered - nudges will arrive on this phone.' };
  } catch (e) {
    return { ok: false, msg: `Token/registration failed: ${e.message}` };
  }
}
