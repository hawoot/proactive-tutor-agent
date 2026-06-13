// Settings - visual-first: paint your nudge schedule on a week grid, slide
// your daily goal, pick a timezone from a list. Forms only where text is
// genuinely text (server URL, your name).
import React, { useCallback, useState } from 'react';
import { Text, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig, saveConfig } from '../api';
import { registerForPush } from '../push';
import { Btn, Card, Field, ErrorText, SectionTitle } from '../components';
import { NudgeTimes, GoalSlider, TimezonePicker } from '../widgets';
import { colors, pad, radius, type } from '../theme';

// Sensible starting point: a morning and an early-evening ping, every day.
const DEFAULT_TIMES = [0, 1, 2, 3, 4, 5, 6].flatMap((d) => [
  { weekday: d, hour: 9, minute: 0 },
  { weekday: d, hour: 18, minute: 0 },
]);

export default function SettingsScreen() {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [userId, setUserId] = useState('1');
  const [connMsg, setConnMsg] = useState('');
  const [prefs, setPrefs] = useState(null);
  const [times, setTimes] = useState(null);
  const [tzPickerOpen, setTzPickerOpen] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState('');
  const [err, setErr] = useState('');

  const loadPrefs = useCallback(async () => {
    try {
      const { userId: uid } = await getConfig();
      const [u, sched] = await Promise.all([api.getUser(uid), api.getSchedule(uid)]);
      setPrefs({
        name: u.name,
        timezone: u.timezone,
        max_prompts_per_day: u.max_prompts_per_day,
        daily_goal: u.daily_goal ?? 3,
      });
      setTimes(sched.length > 0 ? sched : DEFAULT_TIMES);
    } catch { setPrefs(null); setTimes(null); }
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
      await Promise.all([
        api.updateUser(uid, {
          name: prefs.name,
          timezone: prefs.timezone,
          max_prompts_per_day: prefs.max_prompts_per_day,
          daily_goal: Math.max(1, parseInt(prefs.daily_goal, 10) || 3),
        }),
        api.putSchedule(uid, times || []),
      ]);
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
        <Btn label="🔔 Enable push notifications" kind="outline"
          onPress={async () => setConnMsg((await registerForPush()).msg)} />
      </Card>

      {prefs && times && (
        <>
          <SectionTitle>Daily goal</SectionTitle>
          <Card>
            <Text style={[type.meta, { marginBottom: 8 }]}>
              Questions you aim to answer per day - powers the streak.
            </Text>
            <GoalSlider value={prefs.daily_goal} onChange={setPref('daily_goal')} />
          </Card>

          <SectionTitle>When should Nejma nudge you?</SectionTitle>
          <Card>
            <NudgeTimes times={times} onChange={setTimes} />
            <View style={s.stepperRow}>
              <Text style={{ ...type.body, flex: 1 }}>Daily cap (safety limit)</Text>
              <Stepper
                value={prefs.max_prompts_per_day}
                onChange={setPref('max_prompts_per_day')}
                min={0} max={20}
              />
            </View>
            <TouchableOpacity style={s.tzButton} onPress={() => setTzPickerOpen(true)}>
              <Text style={type.body}>🌍 Timezone</Text>
              <Text style={s.tzValue}>{prefs.timezone.replace(/_/g, ' ')} ›</Text>
            </TouchableOpacity>
          </Card>

          <SectionTitle>Me</SectionTitle>
          <Card>
            <Field label="Your name" value={prefs.name} onChangeText={setPref('name')} />
          </Card>

          <Btn label="Save preferences" onPress={savePrefs} />
          {prefsMsg ? <Text style={[s.msg, { textAlign: 'center' }]}>{prefsMsg}</Text> : null}
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

      <TimezonePicker
        visible={tzPickerOpen} value={prefs?.timezone}
        onSelect={(tz) => setPref('timezone')(tz)}
        onClose={() => setTzPickerOpen(false)}
      />
    </ScrollView>
  );
}

function Stepper({ value, onChange, min = 0, max = 99 }) {
  const v = parseInt(value, 10) || 0;
  return (
    <View style={s.stepper}>
      <TouchableOpacity style={s.stepBtn} onPress={() => v > min && onChange(v - 1)}>
        <Text style={s.stepText}>−</Text>
      </TouchableOpacity>
      <Text style={s.stepValue}>{v}</Text>
      <TouchableOpacity style={s.stepBtn} onPress={() => v < max && onChange(v + 1)}>
        <Text style={s.stepText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  msg: { marginTop: 8, color: colors.ink, lineHeight: 20 },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line,
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 2,
    borderColor: colors.line, borderRadius: radius.pill, overflow: 'hidden',
  },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  stepText: { fontSize: 18, fontWeight: '800', color: colors.blue },
  stepValue: { fontSize: 16, fontWeight: '800', color: colors.ink, minWidth: 36, textAlign: 'center' },
  tzButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line,
  },
  tzValue: { fontSize: 15, fontWeight: '700', color: colors.blue },
});
