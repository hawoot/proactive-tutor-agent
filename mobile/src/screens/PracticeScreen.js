// The practice FLOW: one thing per screen. Question -> marking -> a proper
// verdict moment -> continue or done. Pushed full-screen from Today.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { api, getConfig } from '../api';
import { Btn, Card, Chip, Field, ErrorText, EmptyState } from '../components';
import { colors, pad, type } from '../theme';
import { VERDICTS } from '../labels';

export default function PracticeScreen({ route, navigation }) {
  const effort = route.params?.effort || null;
  const [phase, setPhase] = useState('loading'); // loading | question | marking | result | error
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [answer, setAnswer] = useState('');
  const [err, setErr] = useState('');
  const [goal, setGoal] = useState(null);

  const fetchQuestion = useCallback(async (forcedEffort) => {
    setPhase('loading'); setErr(''); setAnswer('');
    try {
      const { userId } = await getConfig();
      let a = await api.openQuestion(userId);
      if (!a) {
        a = await api.newQuestion(userId, forcedEffort ? { effort: forcedEffort } : {});
      }
      setAttempt(a);
      setPhase('question');
    } catch (e) { setErr(e.message); setPhase('error'); }
  }, []);

  useEffect(() => { fetchQuestion(effort); }, [fetchQuestion, effort]);

  const submit = async () => {
    if (!answer.trim()) return;
    setPhase('marking'); setErr('');
    try {
      const { userId } = await getConfig();
      const r = await api.answer(userId, answer.trim());
      setResult(r);
      try {
        const t = await api.today(userId);
        setGoal({ done: t.answered_today, target: t.daily_goal, streak: t.streak_days });
      } catch {}
      setPhase('result');
    } catch (e) { setErr(e.message); setPhase('question'); }
  };

  const skip = async () => {
    try {
      const { userId } = await getConfig();
      await api.skip(userId);
      navigation.goBack();
    } catch (e) { setErr(e.message); }
  };

  if (phase === 'loading') {
    return <View style={s.root}><EmptyState emoji="✏️" title="Picking your question…" /></View>;
  }

  if (phase === 'error') {
    return (
      <View style={s.root}>
        <View style={{ padding: pad }}>
          <EmptyState emoji="🤔" title="No question right now" hint={err} />
          <Btn label="Try again" onPress={() => fetchQuestion(effort)} />
          <Btn label="Back" kind="ghost" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  if (phase === 'result' && result) {
    const v = VERDICTS[result.verdict] || VERDICTS.skipped;
    return (
      <ScrollView style={s.root} contentContainerStyle={{ padding: pad, paddingBottom: 40 }}>
        <View style={[s.verdictBanner, { backgroundColor: v.color + '1A', borderColor: v.color }]}>
          <Text style={{ fontSize: 52 }}>{v.emoji}</Text>
          <Text style={[s.verdictText, { color: v.color }]}>{v.label}</Text>
        </View>
        <Card>
          <Text style={type.label}>Feedback</Text>
          <Text style={[type.body, { marginTop: 6 }]}>{result.feedback || 'Marked.'}</Text>
        </Card>
        {goal ? (
          <Text style={s.goalNote}>
            {goal.done >= goal.target
              ? `🎯 Daily goal complete · 🔥 ${goal.streak}-day streak`
              : `${goal.done} of ${goal.target} today · 🔥 ${goal.streak}-day streak`}
          </Text>
        ) : null}
        <Btn label="Another question" onPress={() => { setResult(null); fetchQuestion(effort); }} />
        <Btn label="Done for now" kind="outline" onPress={() => navigation.goBack()} />
      </ScrollView>
    );
  }

  // question / marking
  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: pad, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <ErrorText>{err}</ErrorText>
        <View style={s.chipRow}>
          {attempt?.skill_name ? <Chip text={attempt.skill_name} color={colors.blue} /> : null}
          <Chip text={attempt?.from_bank ? 'curated' : 'AI-generated'}
            color={attempt?.from_bank ? colors.good : colors.purple} />
          {attempt?.source === 'scheduled' ? <Chip text="from your tutor" color={colors.orange} /> : null}
        </View>
        <Card>
          <Text style={s.question}>{attempt?.question}</Text>
        </Card>
        <Field value={answer} onChangeText={setAnswer} multiline
          placeholder="Type your answer…" autoCapitalize="none" />
        <Btn label={phase === 'marking' ? 'Marking…' : 'Submit'} onPress={submit} busy={phase === 'marking'} />
        <Btn label="Skip this one (no penalty)" kind="ghost" onPress={skip} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  question: { fontSize: 18, lineHeight: 27, color: colors.ink, fontWeight: '500' },
  verdictBanner: {
    alignItems: 'center', padding: 22, borderRadius: 22, borderWidth: 2, marginBottom: 10,
  },
  verdictText: { fontSize: 24, fontWeight: '800', marginTop: 6 },
  goalNote: { textAlign: 'center', color: colors.inkSoft, fontWeight: '600', marginVertical: 8 },
});
