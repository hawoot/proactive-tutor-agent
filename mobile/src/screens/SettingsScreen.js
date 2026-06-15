// Settings - visual-first: paint your nudge schedule on a week grid, slide
// your daily goal, pick a timezone from a list. Forms only where text is
// genuinely text (server URL, your name).
import React, { useCallback, useState } from 'react';
import { Text, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig, saveConfig } from '../api';
import { ensurePermission, syncReminders, nextReminderAt, scheduledCount } from '../notifs';
import { Btn, Card, Field, ErrorText, SectionTitle, Choice } from '../components';
import { NudgeTimes, GoalSlider, TimezonePicker } from '../widgets';
import { colors, pad, radius, type } from '../theme';

const fmtNext = (d) =>
  d ? d.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '';

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
  const [remCount, setRemCount] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [focusId, setFocusId] = useState(null);  // null = interleave (mix all courses)
  const [qSource, setQSource] = useState('bank_first');  // bank_first | bank_only
  const [err, setErr] = useState('');

  const loadPrefs = useCallback(async () => {
    try {
      const { userId: uid } = await getConfig();
      const [u, sched, enrs] = await Promise.all([
        api.getUser(uid), api.getSchedule(uid), api.listEnrollments(uid),
      ]);
      setPrefs({
        name: u.name,
        timezone: u.timezone,
        max_prompts_per_day: u.max_prompts_per_day,
        daily_goal: u.daily_goal ?? 3,
      });
      setTimes(sched.length > 0 ? sched : DEFAULT_TIMES);
      setEnrollments(enrs || []);
      setFocusId(u.focus_enrollment_id ?? null);
      setQSource((enrs && enrs[0]?.question_source) || 'bank_first');
    } catch { setPrefs(null); setTimes(null); }
  }, []);

  useFocusEffect(useCallback(() => {
    (async () => {
      const c = await getConfig();
      setUrl(c.url); setApiKey(c.apiKey); setUserId(String(c.userId));
      loadPrefs();
      setRemCount(await scheduledCount());
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
    const list = times || [];

    // 1) The reminders themselves - purely on your phone, the part that must
    //    never fail. Done first so it works even if the server is down.
    let reminderMsg;
    try {
      const granted = await ensurePermission();
      if (!granted) {
        reminderMsg = '⚠️ Notifications are blocked. Enable them for this app in your phone settings, then save again.';
      } else {
        const count = await syncReminders(list);
        setRemCount(count);
        const next = nextReminderAt(list);
        reminderMsg = `🔔 ${count} reminder${count === 1 ? '' : 's'} set on this phone${next ? `, next ${fmtNext(next)}` : ''}.`;
      }
    } catch (e) { reminderMsg = `⚠️ Could not set reminders: ${e.message}`; }

    // 2) Best-effort sync to your account (for persistence across reinstalls).
    //    If this fails, reminders still work - they don't depend on it.
    let serverMsg = '';
    try {
      const { userId: uid } = await getConfig();
      await Promise.all([
        api.updateUser(uid, {
          name: prefs.name,
          timezone: prefs.timezone,
          max_prompts_per_day: prefs.max_prompts_per_day,
          daily_goal: Math.max(1, parseInt(prefs.daily_goal, 10) || 3),
        }),
        api.putSchedule(uid, list),
      ]);
      serverMsg = ' Saved to your account.';
    } catch { serverMsg = ' (Not synced to the server, but the reminders above still work.)'; }

    setPrefsMsg(reminderMsg + serverMsg);
  };

  const setPref = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }));

  // Focus is a deterministic choice — persist it immediately, on its own.
  const setFocus = async (val) => {
    setFocusId(val);
    try {
      const { userId: uid } = await getConfig();
      await api.updateUser(uid, { focus_enrollment_id: val });
    } catch (e) { setErr(e.message); }
  };

  // Curated-only vs curated+AI — applied across all the user's courses.
  const setSource = async (val) => {
    setQSource(val);
    try {
      await Promise.all(enrollments.map((e) => api.updateEnrollment(e.id, { question_source: val })));
    } catch (e) { setErr(e.message); }
  };

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

      <SectionTitle>Reminders</SectionTitle>
      <Card>
        <Text style={type.meta}>
          Your phone fires reminders from the times below — offline, and even when
          the app is closed.{remCount != null ? `  ${remCount} scheduled right now.` : ''}
        </Text>
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

          {enrollments.length >= 1 && (
            <>
              <SectionTitle>Study focus</SectionTitle>
              <Card>
                <Text style={[type.meta, { marginBottom: 8 }]}>
                  Mix all your courses, or lock practice to one. Your choice sticks until you change it.
                </Text>
                <Choice
                  value={focusId}
                  onChange={setFocus}
                  options={[
                    { value: null, label: '🔀 Mix all courses',
                      hint: 'Interleave — Labib moves between courses by what needs work.' },
                    ...enrollments.map((e) => ({
                      value: e.id, label: `🎯 ${e.program_title || 'Course'}`,
                      hint: 'Focus — practise only this course until you switch.' })),
                  ]}
                />
              </Card>

              <SectionTitle>Questions</SectionTitle>
              <Card>
                <Text style={[type.meta, { marginBottom: 8 }]}>
                  Use only the trusted curated bank, or let Labib generate with AI when the bank runs dry.
                </Text>
                <Choice
                  value={qSource}
                  onChange={setSource}
                  options={[
                    { value: 'bank_first', label: '✨ Curated + AI',
                      hint: 'Curated first; AI generates when needed. More variety, slight wait.' },
                    { value: 'bank_only', label: '✓ Curated only',
                      hint: 'Only trusted curated questions — instant, no AI. Limited to the bank.' },
                  ]}
                />
              </Card>
            </>
          )}

          <SectionTitle>When should Labib nudge you?</SectionTitle>
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

      <SectionTitle>Setup</SectionTitle>
      <Card>
        <Text style={[type.meta, { marginBottom: 8 }]}>
          Creates your user on a fresh backend. Courses and content are added through the
          API / admin, not here.
        </Text>
        <Btn label="Bootstrap my user" kind="outline"
          onPress={async () => {
            try { setConnMsg(`Setup: ${JSON.stringify(await api.seed())}`); }
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
