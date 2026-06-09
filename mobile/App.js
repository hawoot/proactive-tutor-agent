// Proactive Tutor - mobile v0.
// Three screens via simple state (no nav lib yet): Practice / Progress / Settings.
import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { api, getConfig, saveConfig } from './src/api';
import { registerForPush } from './src/push';

export default function App() {
  const [tab, setTab] = useState('practice');
  return (
    <SafeAreaView style={s.root}>
      <Text style={s.title}>Tutor</Text>
      {tab === 'practice' && <Practice />}
      {tab === 'progress' && <Progress />}
      {tab === 'settings' && <Settings />}
      <View style={s.tabs}>
        {['practice', 'progress', 'settings'].map((t) => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabOn]} onPress={() => setTab(t)}>
            <Text style={tab === t ? s.tabTextOn : s.tabText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Practice() {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');
    try {
      const { studentId } = await getConfig();
      const open = await api.openQuestion(studentId);
      setQuestion(open.question);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ask = async () => {
    setBusy(true); setErr(''); setFeedback('');
    try {
      const { studentId } = await getConfig();
      const r = await api.newQuestion(studentId);
      if (r.error) setErr(r.error); else setQuestion(r.question);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const submit = async () => {
    if (!answer.trim()) return;
    setBusy(true); setErr('');
    try {
      const { studentId } = await getConfig();
      const r = await api.answer(studentId, answer);
      setFeedback(r.feedback || '');
      setQuestion(null);
      setAnswer('');
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={s.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {err ? <Text style={s.err}>{err}</Text> : null}
        {question ? (
          <>
            <Text style={s.label}>Question</Text>
            <Text style={s.card}>{question}</Text>
            <TextInput
              style={s.input} value={answer} onChangeText={setAnswer}
              placeholder="Your answer…" multiline
            />
            <Btn label="Submit answer" onPress={submit} busy={busy} />
          </>
        ) : (
          <>
            {feedback ? (<><Text style={s.label}>Feedback</Text><Text style={s.card}>{feedback}</Text></>) : null}
            <Btn label="Give me a question" onPress={ask} busy={busy} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Progress() {
  const [skills, setSkills] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const { studentId } = await getConfig();
        const r = await api.progress(studentId);
        setSkills(r.skills || []);
      } catch (e) { setErr(e.message); }
    })();
  }, []);
  if (err) return <View style={s.body}><Text style={s.err}>{err}</Text></View>;
  if (!skills) return <View style={s.body}><ActivityIndicator /></View>;
  return (
    <ScrollView style={s.body}>
      {skills.map((sk) => (
        <View key={sk.name} style={s.skillRow}>
          <Text style={s.skillName}>{sk.name}</Text>
          <View style={s.barBg}><View style={[s.bar, { width: `${Math.round(sk.mastery * 100)}%` }]} /></View>
          <Text style={s.skillMeta}>{Math.round(sk.mastery * 100)}% · {sk.attempts} attempts</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Settings() {
  const [url, setUrl] = useState('');
  const [studentId, setStudentId] = useState('1');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const c = await getConfig();
      setUrl(c.url); setStudentId(String(c.studentId));
    })();
  }, []);

  const save = async () => {
    await saveConfig(url, studentId);
    try { await api.health(); setMsg('Saved - backend reachable ✓'); }
    catch { setMsg('Saved, but backend NOT reachable. Check the URL / same Wi-Fi.'); }
  };

  const seed = async () => {
    try { const r = await api.seed(); setMsg(JSON.stringify(r)); }
    catch (e) { setMsg(e.message); }
  };

  const push = async () => { const r = await registerForPush(); setMsg(r.msg); };

  return (
    <ScrollView style={s.body}>
      <Text style={s.label}>Backend URL</Text>
      <TextInput style={s.input} value={url} onChangeText={setUrl}
        autoCapitalize="none" placeholder="http://192.168.x.x:8000" />
      <Text style={s.label}>Student ID</Text>
      <TextInput style={s.input} value={studentId} onChangeText={setStudentId} keyboardType="numeric" />
      <Btn label="Save & test connection" onPress={save} />
      <Btn label="Seed demo data" onPress={seed} />
      <Btn label="Enable push notifications" onPress={push} />
      {msg ? <Text style={s.card}>{msg}</Text> : null}
    </ScrollView>
  );
}

function Btn({ label, onPress, busy }) {
  return (
    <TouchableOpacity style={s.btn} onPress={onPress} disabled={busy}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f6f2' },
  title: { fontSize: 24, fontWeight: '700', padding: 16, paddingBottom: 4 },
  body: { flex: 1, padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginTop: 12, marginBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 16, lineHeight: 22 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 16, marginVertical: 8, minHeight: 48 },
  btn: { backgroundColor: '#2b2118', borderRadius: 10, padding: 14, alignItems: 'center', marginVertical: 6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  err: { color: '#b00020', marginVertical: 8 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#e5e2da' },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  tabOn: { borderTopWidth: 2, borderColor: '#2b2118' },
  tabText: { color: '#888', textTransform: 'capitalize' },
  tabTextOn: { color: '#2b2118', fontWeight: '700', textTransform: 'capitalize' },
  skillRow: { marginBottom: 16 },
  skillName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  barBg: { height: 8, backgroundColor: '#e5e2da', borderRadius: 4 },
  bar: { height: 8, backgroundColor: '#2b2118', borderRadius: 4 },
  skillMeta: { fontSize: 12, color: '#777', marginTop: 2 },
});
