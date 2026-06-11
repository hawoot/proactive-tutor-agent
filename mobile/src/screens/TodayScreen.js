// The practice loop: see the open question (pushed or pulled), answer, get marked.
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig } from '../api';
import { Btn, Card, Field, Tag, ErrorText, EmptyText } from '../components';
import { colors, pad } from '../theme';

export default function TodayScreen() {
  const [attempt, setAttempt] = useState(null); // the open question, if any
  const [lastResult, setLastResult] = useState(null); // last marked attempt
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');
    try {
      const { userId } = await getConfig();
      setAttempt(await api.openQuestion(userId));
    } catch (e) { setErr(e.message); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const ask = async (effort) => {
    setBusy(true); setErr(''); setLastResult(null);
    try {
      const { userId } = await getConfig();
      setAttempt(await api.newQuestion(userId, effort ? { effort } : {}));
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const submit = async () => {
    if (!answer.trim()) return;
    setBusy(true); setErr('');
    try {
      const { userId } = await getConfig();
      const r = await api.answer(userId, answer.trim());
      setLastResult(r);
      setAttempt(null);
      setAnswer('');
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const skip = async () => {
    setBusy(true); setErr('');
    try {
      const { userId } = await getConfig();
      await api.skip(userId);
      setAttempt(null);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const verdictColor = { correct: colors.good, partial: colors.warn, wrong: colors.bad };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ padding: pad, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <ErrorText>{err}</ErrorText>

        {attempt ? (
          <>
            <View style={s.row}>
              {attempt.skill_name ? <Tag text={attempt.skill_name} color={colors.shared} /> : null}
              <Tag text={attempt.source === 'scheduled' ? 'nudged' : 'on demand'} />
            </View>
            <Card><Text style={s.question}>{attempt.question}</Text></Card>
            <Field value={answer} onChangeText={setAnswer} placeholder="Your answer…" multiline />
            <Btn label="Submit answer" onPress={submit} busy={busy} />
            <Btn label="Skip (no penalty)" onPress={skip} kind="secondary" busy={busy} />
          </>
        ) : (
          <>
            {lastResult ? (
              <Card>
                <Text style={[s.verdict, { color: verdictColor[lastResult.verdict] || colors.ink }]}>
                  {(lastResult.verdict || '').toUpperCase()}
                </Text>
                <Text style={s.feedback}>{lastResult.feedback}</Text>
              </Card>
            ) : (
              <EmptyText>
                No open question. The agent will nudge you when it's time - or pull one now.
              </EmptyText>
            )}
            <Btn label="Quick question" onPress={() => ask('quick')} busy={busy} />
            <Btn label="Deep question" onPress={() => ask('deep')} kind="secondary" busy={busy} />
            <Btn label="Any question" onPress={() => ask(null)} kind="secondary" busy={busy} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', marginBottom: 6 },
  question: { fontSize: 17, lineHeight: 24, color: colors.ink },
  verdict: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  feedback: { fontSize: 15, lineHeight: 21, color: colors.ink },
});
