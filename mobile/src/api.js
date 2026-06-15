// The only file that knows how to talk to the backend.
// Configure URL / API key / user id once on the Settings screen; stored on-device.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_URL = 'backend_url';
const KEY_API_KEY = 'api_key';
const KEY_USER = 'user_id';

export async function getConfig() {
  const [url, apiKey, userId] = await Promise.all([
    AsyncStorage.getItem(KEY_URL),
    AsyncStorage.getItem(KEY_API_KEY),
    AsyncStorage.getItem(KEY_USER),
  ]);
  return {
    url: (url || '').replace(/\/+$/, ''),
    apiKey: apiKey || '',
    userId: parseInt(userId || '1', 10),
  };
}

export async function saveConfig({ url, apiKey, userId }) {
  await Promise.all([
    AsyncStorage.setItem(KEY_URL, (url || '').trim()),
    AsyncStorage.setItem(KEY_API_KEY, (apiKey || '').trim()),
    AsyncStorage.setItem(KEY_USER, String(userId || 1)),
  ]);
}

async function call(method, path, body) {
  const { url, apiKey } = await getConfig();
  if (!url) throw new Error('Set the backend URL in Settings first.');
  let res;
  try {
    res = await fetch(`${url}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(`Cannot reach the backend (${e.message}). Check the URL in Settings.`);
  }
  if (!res.ok) {
    let detail = `Backend error ${res.status}`;
    try {
      const j = await res.json();
      if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  health: () => call('GET', '/health'),
  seed: () => call('POST', '/seed'),
  policies: () => call('GET', '/policies'),

  // users / settings
  getUser: (uid) => call('GET', `/users/${uid}`),
  updateUser: (uid, patch) => call('PATCH', `/users/${uid}`, patch),
  getSchedule: (uid) => call('GET', `/users/${uid}/schedule`),
  putSchedule: (uid, times) => call('PUT', `/users/${uid}/schedule`, { times }),

  // devices
  registerDevice: (uid, channel, ref, label) =>
    call('POST', '/devices', { user_id: uid, channel, channel_ref: ref, label }),

  // library
  listPrograms: (uid) => call('GET', `/programs?user_id=${uid}`),
  createProgram: (p) => call('POST', '/programs', p),
  updateProgram: (id, uid, patch) => call('PATCH', `/programs/${id}?user_id=${uid}`, patch),
  deleteProgram: (id, uid) => call('DELETE', `/programs/${id}?user_id=${uid}`),
  cloneProgram: (id, uid) => call('POST', `/programs/${id}/clone?user_id=${uid}`),
  programTree: (id) => call('GET', `/programs/${id}/tree`),
  programSkills: (id) => call('GET', `/programs/${id}/skills`),

  createUnit: (uid, u) => call('POST', `/units?user_id=${uid}`, u),
  updateUnit: (id, uid, patch) => call('PATCH', `/units/${id}?user_id=${uid}`, patch),
  deleteUnit: (id, uid) => call('DELETE', `/units/${id}?user_id=${uid}`),

  createSkill: (uid, s) => call('POST', `/skills?user_id=${uid}`, s),
  updateSkill: (id, uid, patch) => call('PATCH', `/skills/${id}?user_id=${uid}`, patch),
  deleteSkill: (id, uid) => call('DELETE', `/skills/${id}?user_id=${uid}`),

  // notes (private annotations)
  listNotes: (uid, q = '') => call('GET', `/notes?user_id=${uid}${q}`),
  createNote: (n) => call('POST', '/notes', n),
  updateNote: (id, uid, body) => call('PATCH', `/notes/${id}?user_id=${uid}`, { body }),
  deleteNote: (id, uid) => call('DELETE', `/notes/${id}?user_id=${uid}`),

  // enrollments
  listEnrollments: (uid) => call('GET', `/enrollments?user_id=${uid}`),
  enroll: (uid, programId, examDate) =>
    call('POST', '/enrollments', { user_id: uid, program_id: programId, exam_date: examDate || null }),
  updateEnrollment: (id, patch) => call('PATCH', `/enrollments/${id}`, patch),
  unenroll: (id) => call('DELETE', `/enrollments/${id}`),

  // practice
  openQuestion: (uid) => call('GET', `/practice/open?user_id=${uid}`),
  newQuestion: (uid, opts = {}) => call('POST', '/practice/question', { user_id: uid, ...opts }),
  answer: (uid, text) => call('POST', '/practice/answer', { user_id: uid, text }),
  chat: (uid, text, opts = {}) => call('POST', '/practice/chat', { user_id: uid, text, ...opts }),
  chatMessages: (uid, attemptId) =>
    call('GET', `/practice/messages?user_id=${uid}${attemptId ? `&attempt_id=${attemptId}` : ''}`),
  skip: (uid) => call('POST', `/practice/skip?user_id=${uid}`),

  // temporary steers: pause / focus a topic or skill (set on the Course tab)
  listOverrides: (uid) => call('GET', `/practice/overrides?user_id=${uid}`),
  setOverride: (uid, body) => call('POST', '/practice/overrides', { user_id: uid, ...body }),
  clearOverride: (uid, id) => call('DELETE', `/practice/overrides/${id}?user_id=${uid}`),

  // question bank
  listQuestions: (skillId) => call('GET', `/skills/${skillId}/questions`),
  createQuestion: (uid, q) => call('POST', `/questions?user_id=${uid}`, q),
  updateQuestion: (id, uid, patch) => call('PATCH', `/questions/${id}?user_id=${uid}`, patch),
  deleteQuestion: (id, uid) => call('DELETE', `/questions/${id}?user_id=${uid}`),

  // progress & home
  today: (uid) => call('GET', `/today?user_id=${uid}`),
  progress: (uid) => call('GET', `/progress?user_id=${uid}`),
  attempts: (uid, limit = 30) => call('GET', `/attempts?user_id=${uid}&limit=${limit}`),
};
