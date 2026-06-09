// The only file that knows how to talk to the backend.
// Set the base URL once on the Settings screen; it's stored on-device.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_URL = 'backend_url';
const KEY_STUDENT = 'student_id';

export async function getConfig() {
  const url = (await AsyncStorage.getItem(KEY_URL)) || '';
  const studentId = parseInt((await AsyncStorage.getItem(KEY_STUDENT)) || '1', 10);
  return { url: url.replace(/\/$/, ''), studentId };
}

export async function saveConfig(url, studentId) {
  await AsyncStorage.setItem(KEY_URL, url.trim());
  await AsyncStorage.setItem(KEY_STUDENT, String(studentId));
}

async function call(method, path, body) {
  const { url } = await getConfig();
  if (!url) throw new Error('Set the backend URL in Settings first.');
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Backend error ${res.status}`);
  return res.json();
}

export const api = {
  health: () => call('GET', '/health'),
  seed: () => call('POST', '/seed'),
  openQuestion: (sid) => call('GET', `/open_question?student_id=${sid}`),
  newQuestion: (sid) => call('POST', `/question?student_id=${sid}`),
  answer: (sid, text) => call('POST', '/message', { student_id: sid, text }),
  progress: (sid) => call('GET', `/progress?student_id=${sid}`),
  registerDevice: (sid, token) =>
    call('POST', '/register_device', { student_id: sid, expo_push_token: token }),
};
