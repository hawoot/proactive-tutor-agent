// Settings, grouped and in human words: connection, notifications,
// learning preferences, demo data.
import React, { useCallback, useState } from 'react';
import { Text, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig, saveConfig } from '../api';
import { registerForPush } from '../push';
import { Btn, Card, Field, ErrorText, SectionTitle } from '../components';
import { colors, pad, type } from '../theme';

export default function SettingsScreen() {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [userId, setUserId] = useState('1');
  const [connMsg, setConnMsg] = useState('');
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
        daily_goal: String(u.daily_goal ?? 3),
      });
    } catch { setPrefs(null); }
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
      let msg = '✅ Connected';
      if (h.auth && !apiKey.trim()) msg = '⚠️ This backend needs an API key - set it above.';
      else {
        try { await api.getUser(parseInt(userId || '1', 10)); }
        catch (e) { msg = `⚠️ Connected, but: ${e.message}`; }
      }
      setConnMsg(msg);
      loadPrefs();
    } catch (e) { setConnMsg(`❌ ${e.message}`); }
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
        daily_goal: parseInt(prefs.daily_goal, 10),
      });
      setPrefsMsg('✅ Saved');
    } catch (e) { setErr(e.message); }
  };

  const setPref = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: pad, paddingBottom: 48 }}>
      <ErrorText>{err}</ErrorText>

      <SectionTitle>Connection</SectionTitle>
      <Card>
        <Field label="Backend URL" value={url} onChangeText={setUrl}
          placeholder="https://your-server:8000" autoCapitalize="none" />
        <Field label="API key" value={apiKey} onChangeText={setApiKey}
          placeholder="from backend/.env" autoCapitalize="none" />
        <Field label="User ID" value={userId} onChangeText={setUserId} keyboardType="numeric" />
        <Btn label="Save & test" onPress={saveConnection} />
        {connMsg ? <Text style={s.msg}>{connMsg}</Text> : null}
      </Card>

      <SectionTitle>Notifications</SectionTitle>
      <Card>
        <Text style={[type.meta, { marginBottom: 8 }]}>
          Nudges arrive as push notifications once enabled on this phone.
        </Text>
        <Btn label="🔔 Enable push notifications" kind="outline"
          onPress={async () => setConnMsg((await registerForPush()).msg)} />
      </Card>

      {prefs && (
        <>
          <SectionTitle>My tutor</SectionTitle>
          <Card>
            <Field label="Daily goal (questions per day)" value={prefs.daily_goal}
              onChangeText={setPref('daily_goal')} keyboardType="numeric"
              hint="Powers the streak and the progress bar on Today." />
            <Field label="Max nudges per day" value={prefs.max_prompts_per_day}
              onChangeText={setPref('max_prompts_per_day')} keyboardType="numeric"
              hint="The tutor never pings you more than this." />
            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Field label="Quiet from (0-23)" value={prefs.quiet_hours_start}
                  onChangeText={setPref('quiet_hours_start')} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="until (0-23)" value={prefs.quiet_hours_end}
                  onChangeText={setPref('quiet_hours_end')} keyboardType="numeric" />
              </View>
            </View>
            <Field label="Timezone" value={prefs.timezone} onChangeText={setPref('timezone')}
              autoCapitalize="none" hint="e.g. Europe/London - quiet hours use this." />
            <Field label="Your name" value={prefs.name} onChangeText={setPref('name')} />
            <Btn label="Save preferences" onPress={savePrefs} />
            {prefsMsg ? <Text style={s.msg}>{prefsMsg}</Text> : null}
          </Card>
        </>
      )}

      <SectionTitle>Demo</SectionTitle>
      <Card>
        <Btn label="Seed demo course (A-level Maths)" kind="outline"
          onPress={async () => {
            try { setConnMsg(`Seed: ${JSON.stringify(await api.seed())}`); }
            catch (e) { setErr(e.message); }
          }} />
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  msg: { marginTop: 8, color: colors.ink, lineHeight: 20 },
  row: { flexDirection: 'row' },
});
