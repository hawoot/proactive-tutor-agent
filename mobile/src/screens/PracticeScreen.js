// Practice = a mini-conversation about ONE question. Answer if you can;
// say you're stuck and the tutor coaches without dumping the solution.
// Answer by TYPING, by TALKING (on-device dictation), or by SNAPPING a photo
// of your handwritten work (read by the vision model). A real answer gets
// marked, closes the question, and moves your mastery.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { api, getConfig } from '../api';
import { Btn, Chip, ErrorText, EmptyState, Mascot } from '../components';
import { colors, pad, radius, type, shadow } from '../theme';
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
  const [listening, setListening] = useState(false);
  const [dictated, setDictated] = useState(false);
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

  // --- voice: on-device dictation fills the box, you review, then send -------
  useSpeechRecognitionEvent('result', (e) => {
    const t = e.results?.[0]?.transcript;
    if (t) { setDraft(t); setDictated(true); }
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', (e) => {
    setListening(false);
    setErr(`Microphone: ${e.error || e.message || 'could not hear you'}`);
  });
  useEffect(() => () => { try { ExpoSpeechRecognitionModule.stop(); } catch {} }, []);

  const toggleMic = async () => {
    if (thinking) return;
    if (listening) { try { ExpoSpeechRecognitionModule.stop(); } catch {} setListening(false); return; }
    try {
      const p = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!p.granted) { setErr('Microphone permission denied — enable it in phone settings.'); return; }
      setErr(''); setDraft(''); setDictated(false);
      ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true });
      setListening(true);
    } catch (e) { setErr(`Microphone: ${e.message}`); }
  };

  // --- the one send path: text, voice-dictated text, or a photo -------------
  const sendMessage = async ({ text = '', images = null, localUri = null }) => {
    const content = (text ?? '').trim();
    if ((!content && !images) || thinking) return;
    if (listening) { try { ExpoSpeechRecognitionModule.stop(); } catch {} setListening(false); }
    setErr(''); setDraft(''); setThinking(true);
    const modality = images ? 'photo' : (dictated ? 'voice' : 'text');
    setDictated(false);
    setMessages((m) => [...m, {
      id: `tmp-${Date.now()}`, role: 'student', kind: 'chat',
      content: content || (images ? '📷 my working' : ''), modality, localUri,
    }]);
    try {
      const { userId } = await getConfig();
      const r = await api.chat(userId, content, { attempt_id: attempt?.id, images, modality });
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

  const send = (text) => sendMessage({ text: text ?? draft });

  // --- camera / library: a photo of handwritten work ------------------------
  const pickImage = async (source) => {
    if (thinking) return;
    try {
      const opts = { quality: 0.4, base64: true, allowsEditing: true, mediaTypes: ['images'] };
      let res;
      if (source === 'camera') {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) { setErr('Camera permission denied — enable it in phone settings.'); return; }
        res = await ImagePicker.launchCameraAsync(opts);
      } else {
        res = await ImagePicker.launchImageLibraryAsync(opts);
      }
      if (res.canceled) return;
      const asset = res.assets[0];
      if (!asset?.base64) { setErr('Could not read that image.'); return; }
      sendMessage({ text: draft, images: [asset.base64], localUri: asset.uri });
    } catch (e) { setErr(e.message); }
  };

  const attachPhoto = () => {
    if (thinking) return;
    Alert.alert('Photo of your work', 'Snap your handwritten working and Labib will read it.', [
      { text: '📷 Take photo', onPress: () => pickImage('camera') },
      { text: '🖼  Choose from library', onPress: () => pickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Skip / next: always let you choose the KIND of the next question.
  // `afterSkip` dismisses the current question first (mastery untouched).
  const chooseNext = (afterSkip) => {
    Alert.alert(
      afterSkip ? 'Skip — what next?' : 'Another question',
      'Pick the kind you want next.',
      [
        { text: '⚡ Quick one', onPress: () => goNext('quick', afterSkip) },
        { text: '🧠 Deep dive', onPress: () => goNext('deep', afterSkip) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };
  const goNext = async (kind, afterSkip) => {
    if (afterSkip) {
      try { const { userId } = await getConfig(); await api.skip(userId); }
      catch (e) { setErr(e.message); }
    }
    loadFresh(kind);
  };

  if (phase === 'loading') {
    return <View style={s.root}><EmptyState pose="think" title="Labib is picking your question…" /></View>;
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
  const fbIdx = messages.findIndex((m) => m.kind === 'feedback');
  const preMessages = fbIdx >= 0 ? messages.slice(0, fbIdx + 1) : messages;
  const postMessages = fbIdx >= 0 ? messages.slice(fbIdx + 1) : [];

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.chipRow}>
        {attempt?.skill_name ? <Chip text={attempt.skill_name} color={colors.blue} /> : null}
        <Chip text={attempt?.from_bank ? 'curated' : 'AI-generated'}
          color={attempt?.from_bank ? colors.good : colors.purple} />
        {attempt?.source === 'scheduled' ? <Chip text="from Labib" color={colors.orange} /> : null}
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
            <Text style={s.thinking}>Labib is thinking…</Text>
          </View>
        ) : null}

        {closed ? (
          <>
            <Btn label="Another question" onPress={() => chooseNext(false)} />
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
            <TouchableOpacity style={s.quickChip} onPress={() => chooseNext(true)}>
              <Text style={s.quickText}>⏭️ Skip → choose next</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.inputBar}>
          {!closed && (
            <>
              <TouchableOpacity style={s.iconBtn} onPress={attachPhoto} disabled={thinking}>
                <Text style={s.icon}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.iconBtn, listening && s.iconBtnLive]} onPress={toggleMic} disabled={thinking}>
                <Text style={[s.icon, listening && { color: '#fff' }]}>🎤</Text>
              </TouchableOpacity>
            </>
          )}
          <TextInput
            style={s.input} value={draft} multiline
            onChangeText={(t) => { setDraft(t); setDictated(false); }}
            placeholder={listening ? 'Listening… speak now' : (closed ? 'Any follow-up?' : 'Type, talk, or snap a photo…')}
            placeholderTextColor={colors.inkFaint}
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
      {m.localUri ? <Image source={{ uri: m.localUri }} style={s.photo} resizeMode="cover" /> : null}
      {m.content ? (
        <Text style={[s.bubbleText, student && { color: '#fff' },
          isQuestion && { fontSize: 17, lineHeight: 25, fontWeight: '500' }]}>
          {m.content}
        </Text>
      ) : null}
      {m.modality === 'voice' ? <Text style={[s.tag, student && { color: '#ffffffcc' }]}>🎤 spoken</Text> : null}
      {m.modality === 'photo' && !m.localUri ? <Text style={[s.tag, student && { color: '#ffffffcc' }]}>📷 photo</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: pad, paddingTop: 8 },
  bubble: { maxWidth: '86%', borderRadius: radius.lg, padding: 12, marginVertical: 5 },
  tutorBubble: {
    alignSelf: 'flex-start', backgroundColor: colors.card,
    borderBottomLeftRadius: 6, ...shadow.sm,
  },
  studentBubble: {
    alignSelf: 'flex-end', backgroundColor: colors.blue, borderBottomRightRadius: 6, ...shadow.sm,
  },
  questionBubble: {
    backgroundColor: colors.card, maxWidth: '100%', alignSelf: 'stretch',
    borderLeftWidth: 4, borderLeftColor: colors.blue,
  },
  questionLabel: { fontSize: 11, fontWeight: '800', color: colors.blueDark, marginBottom: 4, letterSpacing: 1 },
  bubbleText: { fontSize: 15.5, lineHeight: 22, color: colors.ink },
  photo: { width: 220, height: 165, borderRadius: radius.md, marginBottom: 6, backgroundColor: colors.bgSoft },
  tag: { fontSize: 11, color: colors.inkFaint, marginTop: 4, fontWeight: '700' },
  thinking: { color: colors.inkSoft, fontStyle: 'italic' },
  verdictBanner: {
    alignItems: 'center', padding: 18, borderRadius: radius.xl, borderWidth: 1.5, marginVertical: 10, ...shadow.sm,
  },
  verdictText: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  goalNote: { color: colors.inkSoft, fontWeight: '600', marginTop: 6 },
  followupHint: { color: colors.inkSoft, fontSize: 12.5, marginTop: 8 },
  composer: {
    backgroundColor: colors.bg, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  quickChip: {
    borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7,
    marginRight: 8, marginBottom: 4, backgroundColor: colors.card, ...shadow.sm,
  },
  quickText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.card,
    borderRadius: radius.xl, paddingHorizontal: 6, paddingVertical: 5, ...shadow.md,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnLive: { backgroundColor: colors.red },
  icon: { fontSize: 20 },
  input: {
    flex: 1, paddingHorizontal: 8, paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 16, color: colors.ink, maxHeight: 120,
  },
  sendBtn: {
    marginLeft: 4, backgroundColor: colors.primary, borderRadius: radius.pill,
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 3, borderBottomColor: colors.primaryDark,
  },
  sendText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
