// Connection (URL + API key + user), tutor preferences (quiet hours, caps,
// timezone), push registration, and the demo seed.
import React, { useCallback, useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig, saveConfig } from '../api';
import { registerForPush } from '../push';
import { Btn, Card, Field, ErrorText } from '../components';
import { colors, pad } from '../theme';

export default function SettingsScreen() {
  // connection
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [userId, setUserId] = useState('1');
  const [connMsg, setConnMsg] = useState('');
  // tutor prefs (loaded from the backend once connected)
  const [prefs, setPrefs] = useState(null);
  const [prefsMsg, setPrefsMsg] = useState('');
  const [err, setErr] = useState('');

  const loadPrefs = useCallback(async () => {
    try {
      const { userId: uid } = await getConfig();
      const u = await api.getUser(uid);
      setPrefs({
        name: u.name,
        timezone: u.timezone,
        quiet_hours_start: String(u.quiet_hours_start),
        quiet_hours_end: String(u.quiet_hours_end),
        max_prompts_per_day: String(u.max_prompts_per_day),
      });
    } catch { setPrefs(null); } // not connected yet - fine
  }, []);

  useFocusEffect(useCallback(() => {
    (async () => {
      const c = await getConfig();
      setUrl(c.url); setApiKey(c.apiKey); setUserId(String(c.userId));
      loadPrefs();
    })();
  }, [loadPrefs]));

  const saveConnection = async () => {
    setErr(''); setConnMsg('');
    await saveConfig({ url, apiKey, userId: parseInt(userId || '1', 10) });
    try {
      const h = await api.health();
      let msg = 'Saved - backend reachable ✓';
      if (h.auth && !apiKey.trim()) msg += '\n⚠ Backend requires an API key - set it above.';
      // verify the key + user actually work
      try { await api.getUser(parseInt(userId || '1', 10)); }
      catch (e) { msg += `\n⚠ ${e.message}`; }
      setConnMsg(msg);
      loadPrefs();
    } catch (e) {
      setConnMsg(`Saved, but: ${e.message}`);
    }
  };

  const seed = async () => {
    setErr('');
    try {
      const r = await api.seed();
      setConnMsg(`Seed: ${JSON.stringify(r)}`);
      loadPrefs();
    } catch (e) { setErr(e.message); }
  };

  const push = async () => {
    const r = await registerForPush();
    setConnMsg(r.msg);
  };

  const savePrefs = async () => {
    setErr(''); setPrefsMsg('');
    try {
      const { userId: uid } = await getConfig();
      await api.updateUser(uid, {
        name: prefs.name,
        timezone: prefs.timezone,
        quiet_hours_start: parseInt(prefs.quiet_hours_start, 10),
        quiet_hours_end: parseInt(prefs.quiet_hours_end, 10),
        max_prompts_per_day: parseInt(prefs.max_prompts_per_day, 10),
      });
      setPrefsMsg('Preferences saved ✓');
    } catch (e) { setErr(e.message); }
  };

  const setPref = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: pad, paddingBottom: 48 }}>
      <ErrorText>{err}</ErrorText>

      <Text style={s.section}>Connection</Text>
      <Field label="Backend URL" value={url} onChangeText={setUrl}
        placeholder="http://YOUR_SERVER:8000" autoCapitalize="none" />
      <Field label="API key (X-API-Key from backend/.env)" value={apiKey} onChangeText={setApiKey}
        placeholder="leave empty if the backend has no key" autoCapitalize="none" />
      <Field label="User ID" value={userId} onChangeText={setUserId} keyboardType="numeric" />
      <Btn label="Save & test connection" onPress={saveConnection} />
      {connMsg ? <Card><Text style={s.msg}>{connMsg}</Text></Card> : null}

      <Text style={s.section}>Notifications</Text>
      <Btn label="Enable push notifications on this phone" onPress={push} kind="secondary" />

      {prefs && (
        <>
          <Text style={s.section}>Tutor preferences</Text>
          <Field label="Your name" value={prefs.name} onChangeText={setPref('name')} />
          <Field label="Timezone (IANA, e.g. Europe/London)" value={prefs.timezone}
            onChangeText={setPref('timezone')} autoCapitalize="none" />
          <Field label="Quiet hours start (0-23, local time - no nudges after this)"
            value={prefs.quiet_hours_start} onChangeText={setPref('quiet_hours_start')}
            keyboardType="numeric" />
          <Field label="Quiet hours end (0-23)"
            value={prefs.quiet_hours_end} onChangeText={setPref('quiet_hours_end')}
            keyboardType="numeric" />
          <Field label="Max nudges per day"
            value={prefs.max_prompts_per_day} onChangeText={setPref('max_prompts_per_day')}
            keyboardType="numeric" />
          <Btn label="Save preferences" onPress={savePrefs} />
          {prefsMsg ? <Card><Text style={s.msg}>{prefsMsg}</Text></Card> : null}
        </>
      )}

      <Text style={s.section}>Demo</Text>
      <Btn label="Seed demo data (A-level Maths)" onPress={seed} kind="secondary" />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  section: {
    fontSize: 14, fontWeight: '700', color: colors.inkSoft,
    marginTop: 20, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  msg: { color: colors.ink, lineHeight: 20 },
});
