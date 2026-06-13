// Practice = a mini-conversation about ONE question. Answer if you can;
// say you're stuck and the tutor coaches without dumping the solution.
// A real answer gets marked, closes the question, and moves your mastery.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { api, getConfig } from '../api';
import { Btn, Chip, ErrorText, EmptyState, Mascot } from '../components';
import { colors, pad, radius, type } from '../theme';
import { VERDICTS } from '../labels';

const QUICK_REPLIES = [
  { label: '💡 Hint', text: 'Can you give me a small hint, not the answer?' },
  { label: '🤔 I’m stuck', text: "I'm stuck - I don't know how to start." },
  { label: '📖 Show me', text: 'Please show me the full solution and walk me through it.' },
];

// After marking, the conversation stays open - getting it right isn't the
// same as being sure, and feedback can be unclear.
const FOLLOWUP_REPLIES = [
  { label: '🔍 Explain more', text: 'Can you explain that in more depth, step by step?' },
  { label: '🤷 Still unsure', text: "I got the verdict, but I'm still not fully sure why. Can you clarify?" },
  { label: '🧪 Similar example', text: 'Can you show me a similar example worked through?' },
];

export default function PracticeScreen({ route, navigation }) {
  const effort = route.params?.effort || null;
  const attemptId = route.params?.attemptId || null;  // set = reopen a past conversation
  const [phase, setPhase] = useState('loading'); // loading | chat | error
  const [attempt, setAttempt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [closed, setClosed] = useState(false);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [err, setErr] = useState('');
  const [goal, setGoal] = useState(null);
  const scrollRef = useRef(null);

  const applyResponse = (r) => {
    setAttempt(r.attempt);
    setMessages(r.messages);
    setClosed(r.closed);
  };

  // A fresh question: the open one if any, otherwise a new one of this effort.
  const loadFresh = useCallback(async (eff) => {
    setPhase('loading'); setErr(''); setGoal(null); setDraft('');
    try {
      const { userId } = await getConfig();
      let a = await api.openQuestion(userId);
      if (!a) a = await api.newQuestion(userId, eff ? { effort: eff } : {});
      applyResponse(await api.chatMessages(userId, a.id));
      setPhase('chat');
    } catch (e) { setErr(e.message); setPhase('error'); }
  }, []);

  // Entry point: reopen a specific past conversation, or start a fresh one.
  const start = useCallback(async () => {
    if (!attemptId) return loadFresh(effort);
    setPhase('loading'); setErr(''); setGoal(null); setDraft('');
    try {
      const { userId } = await getConfig();
      applyResponse(await api.chatMessages(userId, attemptId));
      setPhase('chat');
    } catch (e) { setErr(e.message); setPhase('error'); }
  }, [attemptId, effort, loadFresh]);

  useEffect(() => { start(); }, [start]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, thinking]);

  const send = async (text) => {
    const content = (text ?? draft).trim();
    if (!content || thinking) return;
    setErr(''); setDraft(''); setThinking(true);
    // optimistic: show the student's bubble immediately
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: 'student', kind: 'chat', content }]);
    try {
      const { userId } = await getConfig();
      const r = await api.chat(userId, content, { attempt_id: attempt?.id });
      applyResponse(r);
      if (r.closed) {
        try {
          const t = await api.today(userId);
          setGoal({ done: t.answered_today, target: t.daily_goal, streak: t.streak_days });
        } catch {}
      }
    } catch (e) { setErr(e.message); }
    setThinking(false);
  };

  // Skip = dismiss this question and go straight to the next one, in place -
  // no bouncing out to the home screen and back.
  const skip = async () => {
    try {
      const { userId } = await getConfig();
      await api.skip(userId);
    } catch (e) { setErr(e.message); }
    loadFresh(effort);
  };

  const comingSoon = () => Alert.alert(
    'Coming in the next app build',
    'Voice answers and photo uploads need microphone/camera access, which ships with the next app version.');

  if (phase === 'loading') {
    return <View style={s.root}><EmptyState pose="think" title="Nejma is picking your question…" /></View>;
  }
  if (phase === 'error') {
    return (
      <View style={s.root}>
        <View style={{ padding: pad }}>
          <EmptyState pose="think" title="No question right now" hint={err} />
          <Btn label="Try again" onPress={start} />
          <Btn label="Back" kind="ghost" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const verdict = closed ? (VERDICTS[attempt?.verdict] || VERDICTS.skipped) : null;
  // render the banner right after the feedback message; follow-up chat flows below it
  const fbIdx = messages.findIndex((m) => m.kind === 'feedback');
  const preMessages = fbIdx >= 0 ? messages.slice(0, fbIdx + 1) : messages;
  const postMessages = fbIdx >= 0 ? messages.slice(fbIdx + 1) : [];

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* context chips */}
      <View style={s.chipRow}>
        {attempt?.skill_name ? <Chip text={attempt.skill_name} color={colors.blue} /> : null}
        <Chip text={attempt?.from_bank ? 'curated' : 'AI-generated'}
          color={attempt?.from_bank ? colors.good : colors.purple} />
        {attempt?.source === 'scheduled' ? <Chip text="from Nejma" color={colors.orange} /> : null}
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }}
        contentContainerStyle={{ padding: pad, paddingTop: 6 }}
        keyboardShouldPersistTaps="handled">
        <ErrorText>{err}</ErrorText>
        {preMessages.map((m) => <Bubble key={m.id} m={m} />)}

        {closed && verdict ? (
          <View style={[s.verdictBanner, { backgroundColor: verdict.color + '1A', borderColor: verdict.color }]}>
            <Mascot pose={verdict.pose} size={96} bob={false} />
            <Text style={[s.verdictText, { color: verdict.color }]}>{verdict.label}</Text>
            {goal ? (
              <Text style={s.goalNote}>
                {goal.done >= goal.target
                  ? `🎯 Daily goal complete · 🔥 ${goal.streak}-day streak`
                  : `${goal.done} of ${goal.target} today · 🔥 ${goal.streak}-day streak`}
              </Text>
            ) : null}
            <Text style={s.followupHint}>Still unsure about anything? Keep asking below 👇</Text>
          </View>
        ) : null}

        {postMessages.map((m) => <Bubble key={m.id} m={m} />)}
        {thinking ? (
          <View style={[s.bubble, s.tutorBubble, { flexDirection: 'row', alignItems: 'center' }]}>
            <Mascot pose="think" size={28} bob={false} style={{ marginRight: 8 }} />
            <Text style={s.thinking}>Nejma is thinking…</Text>
          </View>
        ) : null}

        {closed ? (
          <>
            <Btn label="Another question" onPress={() => loadFresh(effort)} />
            <Btn label="Done for now" kind="outline" onPress={() => navigation.goBack()} />
          </>
        ) : null}
      </ScrollView>

      <View style={s.composer}>
        <View style={s.quickRow}>
          {(closed ? FOLLOWUP_REPLIES : QUICK_REPLIES).map((q) => (
            <TouchableOpacity key={q.label} style={s.quickChip} onPress={() => send(q.text)}>
              <Text style={s.quickText}>{q.label}</Text>
            </TouchableOpacity>
          ))}
          {!closed && (
            <TouchableOpacity style={s.quickChip} onPress={skip}>
              <Text style={s.quickText}>⏭️ Skip → next</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={s.inputRow}>
          <TouchableOpacity style={s.iconBtn} onPress={comingSoon}>
            <Text style={s.iconDisabled}>🎤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={comingSoon}>
            <Text style={s.iconDisabled}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={s.input} value={draft} onChangeText={setDraft} multiline
            placeholder={closed ? 'Any follow-up questions?' : 'Answer, or ask about it…'}
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[s.sendBtn, (!draft.trim() || thinking) && { opacity: 0.4 }]}
            onPress={() => send()} disabled={!draft.trim() || thinking}
          >
            <Text style={s.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ m }) {
  const student = m.role === 'student';
  const isQuestion = m.kind === 'question';
  return (
    <View style={[
      s.bubble,
      student ? s.studentBubble : s.tutorBubble,
      isQuestion && s.questionBubble,
    ]}>
      {isQuestion ? <Text style={s.questionLabel}>QUESTION</Text> : null}
      <Text style={[s.bubbleText, student && { color: '#fff' },
        isQuestion && { fontSize: 17, lineHeight: 25, fontWeight: '500' }]}>
        {m.content}
      </Text>
      {m.modality === 'voice' ? <Text style={s.voiceTag}>🎤 spoken</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: pad, paddingTop: 8 },
  bubble: {
    maxWidth: '86%', borderRadius: radius.lg, padding: 12, marginVertical: 4,
  },
  tutorBubble: {
    alignSelf: 'flex-start', backgroundColor: colors.bgSoft,
    borderWidth: 2, borderColor: colors.line, borderBottomLeftRadius: 6,
  },
  studentBubble: {
    alignSelf: 'flex-end', backgroundColor: colors.blue, borderBottomRightRadius: 6,
  },
  questionBubble: {
    backgroundColor: colors.card, borderColor: colors.blue, maxWidth: '100%',
    alignSelf: 'stretch',
  },
  questionLabel: { fontSize: 11, fontWeight: '800', color: colors.blueDark, marginBottom: 4, letterSpacing: 1 },
  bubbleText: { fontSize: 15.5, lineHeight: 22, color: colors.ink },
  voiceTag: { fontSize: 11, color: '#ffffffcc', marginTop: 4 },
  thinking: { color: colors.inkSoft, fontStyle: 'italic' },
  verdictBanner: {
    alignItems: 'center', padding: 18, borderRadius: 22, borderWidth: 2, marginVertical: 10,
  },
  verdictText: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  goalNote: { color: colors.inkSoft, fontWeight: '600', marginTop: 6 },
  followupHint: { color: colors.inkSoft, fontSize: 12.5, marginTop: 8 },
  composer: {
    borderTopWidth: 2, borderTopColor: colors.line, backgroundColor: colors.bg,
    paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  quickChip: {
    borderWidth: 2, borderColor: colors.line, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 4,
    backgroundColor: colors.card,
  },
  quickText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  iconBtn: { padding: 8 },
  iconDisabled: { fontSize: 20, opacity: 0.35 },
  input: {
    flex: 1, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line,
    borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 16, color: colors.ink, maxHeight: 120,
  },
  sendBtn: {
    marginLeft: 8, backgroundColor: colors.primary, borderRadius: radius.pill,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 3, borderBottomColor: colors.primaryDark,
  },
  sendText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
