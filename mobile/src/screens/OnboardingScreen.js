// First launch: four friendly steps that end with the tutor working.
// Connect -> pick a course -> notifications -> go.
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { api, getConfig, saveConfig } from '../api';
import { ensurePermission } from '../notifs';
import { Btn, Card, Field, ErrorText, Chip, Mascot } from '../components';
import { colors, pad, type } from '../theme';
import { BRAND } from '../brand';

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [programs, setPrograms] = useState([]);
  const [enrolledId, setEnrolledId] = useState(null);

  const finish = () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

  const testConnection = async () => {
    setBusy(true); setErr('');
    try {
      await saveConfig({ url, apiKey, userId: 1 });
      const h = await api.health();
      if (h.auth && !apiKey.trim()) throw new Error('This backend requires an API key.');
      let progs;
      try {
        progs = await api.listPrograms(1);
      } catch {
        await api.seed();  // fresh server: create the demo course + user 1
        progs = await api.listPrograms(1);
      }
      if (progs.length === 0) { await api.seed(); progs = await api.listPrograms(1); }
      setPrograms(progs);
      setEnrolledId(progs.find((p) => p.enrolled)?.id ?? null);
      setStep(2);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const enroll = async (p) => {
    setBusy(true); setErr('');
    try {
      await api.enroll(1, p.id);
      setEnrolledId(p.id);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: pad, paddingTop: 60, paddingBottom: 48 }}>
      {/* progress dots */}
      <View style={s.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[s.dot, i <= step && { backgroundColor: colors.primary }]} />
        ))}
      </View>

      {step === 0 && (
        <View style={s.center}>
          <Mascot pose="wave" size={150} />
          <Text style={s.h1}>Meet {BRAND.mascotName} — the tutor who chases YOU</Text>
          <Text style={s.sub}>{BRAND.story}</Text>
          <Text style={s.sub}>
            She plans practice around your exam, pings you at the right moments,
            and remembers exactly what you struggle with.
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
            <Btn label="Let's go" onPress={() => setStep(1)} />
          </View>
        </View>
      )}

      {step === 1 && (
        <>
          <Text style={s.h1}>Connect to Nejma's server</Text>
          <Text style={s.sub}>Ask whoever runs the backend for these two values.</Text>
          <ErrorText>{err}</ErrorText>
          <Card>
            <Field label="Server URL" value={url} onChangeText={setUrl}
              placeholder="https://your-server:8000" autoCapitalize="none" />
            <Field label="API key" value={apiKey} onChangeText={setApiKey}
              placeholder="leave empty if none" autoCapitalize="none" />
          </Card>
          <Btn label="Connect" onPress={testConnection} busy={busy} />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={s.h1}>Pick a course</Text>
          <Text style={s.sub}>You can add more (or build your own) any time.</Text>
          <ErrorText>{err}</ErrorText>
          {programs.map((p) => (
            <Card key={p.id} tint={enrolledId === p.id ? colors.primary : undefined}>
              <View style={s.rowBetween}>
                <Text style={s.courseTitle}>{p.title}</Text>
                {p.level ? <Chip text={p.level} color={colors.blue} /> : null}
              </View>
              <Text style={type.meta}>{p.skill_count} skills</Text>
              {enrolledId === p.id
                ? <Text style={s.enrolledText}>✅ Enrolled</Text>
                : <Btn small label="Enroll" onPress={() => enroll(p)} busy={busy} />}
            </Card>
          ))}
          <Btn label="Continue" onPress={() => setStep(3)} busy={busy} />
        </>
      )}

      {step === 3 && (
        <View style={s.center}>
          <Mascot pose="coach" size={130} />
          <Text style={s.h1}>Let Nejma reach you</Text>
          <Text style={s.sub}>
            The proactive part: your phone reminds you to practise at the times
            you choose in Settings. Allow notifications so they can come through.
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
            <Btn label="Enable notifications" onPress={async () => {
              await ensurePermission();
              finish();
            }} />
            <Btn label="Maybe later" kind="ghost" onPress={finish} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line },
  center: { alignItems: 'center', paddingTop: 24 },
  h1: { fontSize: 24, fontWeight: '800', color: colors.ink, textAlign: 'center', marginTop: 10 },
  sub: { ...type.body, color: colors.inkSoft, textAlign: 'center', marginTop: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, flexShrink: 1, marginRight: 8 },
  enrolledText: { color: colors.primaryDark, fontWeight: '800', marginTop: 8 },
});
