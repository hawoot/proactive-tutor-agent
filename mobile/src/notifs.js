// notifs.js — the ENTIRE notification system, on purpose.
//
// How it works (one sentence): your phone's operating system fires reminders
// from the times you chose; there is no server, no network, no push token, no
// FCM. Reminders work offline and even when the app is closed.
//
// Source of truth: the times list. syncReminders(times) makes the phone's
// scheduled reminders exactly match it. Everything else here is a thin helper.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANNEL_ID = 'reminders';
const TIMES_KEY = 'reminder_times';

// Show the banner even if the app happens to be open when one fires.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Practice reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

export async function ensurePermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

// our weekday 0=Mon..6=Sun  ->  expo weekday 1=Sun..7=Sat
const toExpoWeekday = (d) => ((d + 1) % 7) + 1;

const CONTENT = {
  title: '🌟 Time to practice',
  body: 'Tap to answer a quick question.',
  data: { practice: true },
  sound: 'default',
};

// THE function that matters. Cancel everything, reschedule from `times`.
// Idempotent: calling it twice with the same list leaves the same reminders.
// Returns how many reminders are now scheduled on the phone.
export async function syncReminders(times) {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(TIMES_KEY, JSON.stringify(times || []));
  for (const t of times || []) {
    await Notifications.scheduleNotificationAsync({
      content: CONTENT,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(t.weekday),
        hour: t.hour,
        minute: t.minute,
        channelId: CHANNEL_ID,
      },
    });
  }
  return scheduledCount();
}

// Re-apply the saved reminders. Call on app start so they self-heal if the OS
// ever clears them (e.g. after an app update). No network needed.
export async function rehydrateReminders() {
  try {
    const raw = await AsyncStorage.getItem(TIMES_KEY);
    if (raw) await syncReminders(JSON.parse(raw));
  } catch {}
}

export async function scheduledCount() {
  try { return (await Notifications.getAllScheduledNotificationsAsync()).length; }
  catch { return 0; }
}

// Prove delivery works on THIS phone: fires once, ~10s from now.
export async function fireTestReminder() {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title: '✅ Test reminder', body: 'Notifications work on this phone.', sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      channelId: CHANNEL_ID,
    },
  });
}

// The next time a reminder will fire, computed locally for display. null = none.
export function nextReminderAt(times) {
  if (!times || !times.length) return null;
  const now = new Date();
  let best = null;
  for (let off = 0; off < 8; off++) {
    const d = new Date(now);
    d.setDate(now.getDate() + off);
    const ourWeekday = (d.getDay() + 6) % 7;  // JS 0=Sun -> our 0=Mon
    for (const t of times) {
      if (t.weekday !== ourWeekday) continue;
      const cand = new Date(d);
      cand.setHours(t.hour, t.minute, 0, 0);
      if (cand <= now) continue;
      if (!best || cand < best) best = cand;
    }
  }
  return best;
}
