// Practice = one continuous session about ONE question at a time. Answer if you
// can; ask Labib to walk you through it; or have him show the full solution.
// Answer by TYPING, by TALKING (on-device dictation), or by SNAPPING a photo of
// your handwritten work (read by the vision model). A real answer gets marked,
// closes the question, and moves your mastery — then the next one flows right in.
//
// Design: the session has a header you can always read (back · progress · the
// sticky Quick/Deep toggle Labib pre-set). Help is two buttons. Skip and Next
// are one tap each. Nothing pops up — every choice lives in the themed UI.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, getConfig } from '../api';
import { Btn, Chip, ErrorText, EmptyState, Mascot, Sheet } from '../components';
import { colors, pad, radius, type, shadow } from '../theme';
import { VERDICTS } from '../labels';

// Help as a ladder of how much you want lifted (solution always last):
//  - Walk me through it : I have the basics, just guide me through THIS one.
//  - Back up to basics  : I'm missing prerequisites — rewind and teach the
//                         foundation first, then come back. (Not the solution.)
//  - Show me the solution : just show the full worked answer.
const HELP_REPLIES = [
  { label: '🧭 Walk me through it', primary: true,
    text: "I want to solve this myself — walk me through it step by step. Start with a small hint and let me try each step. Don't give me the full solution yet." },
  { label: '🪜 Back up to basics',
    text: "I think I'm missing the prerequisites for this — I have the will but not the basics. Don't show me the solution. Help me figure out which foundational idea I'm missing, teach me that first with a simpler example, then bring me back to this question." },
  { label: '👁 Show me the solution',
    text: 'Please show me the full solution and walk me through it.' },
];

// After marking, the conversation stays open - getting it right isn't the
// same as being sure, and feedback can be unclear.
const FOLLOWUP_REPLIES = [
  { label: '🔍 Explain more', text: 'Can you explain that in more depth, step by step?' },
  { label: '🤷 Still unsure', text: "I got the verdict, but I'm still not fully sure why. Can you clarify?" },
  { label: '🧪 Similar example', text: 'Can you show me a similar example worked through?' },
];

// The mic must NOT decide when you're done. continuous mode + generous Android
// silence windows mean a pause to gather your thoughts (this is maths) never
// ends dictation — it stops only when you tap the mic.
const MIC_OPTIONS = {
  lang: 'en-US',
  interimResults: true,
  continuous: true,
  androidIntentOptions: {
    EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 15000,
    EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 15000,
    EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 30000,
  },
};

// The three practice modes — what KIND of question you want now (not a skill lock).
const MODES = [
  ['on_the_go', '📱', 'On the go'],
  ['short_drill', '✏️', 'Short drill'],
  ['problem', '🧩', 'Problem'],
];

export default function PracticeScreen({ route, navigation }) {
  const routeMode = route.params?.mode || null;
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
  const [prog, setProg] = useState(null);       // { done, target, streak }
  const [mode, setMode] = useState(
    MODES.some((m) => m[0] === routeMode) ? routeMode : 'short_drill'); // sticky
  const [photoSheet, setPhotoSheet] = useState(false);
  const scrollRef = useRef(null);
  // voice: wantMic = the user intends to keep dictating (cleared only by a
  // manual stop); base = text already committed so new speech appends rather
  // than replaces; restarts caps runaway auto-restarts.
  const wantMicRef = useRef(false);
  const baseRef = useRef('');
  const restartsRef = useRef(0);   // consecutive *fast* restarts (loop guard)
  const lastEndRef = useRef(0);
  // draft persistence across navigation, keyed by attempt.
  const draftRef = useRef('');
  const attemptIdRef = useRef(null);

  const applyResponse = (r) => {
    setAttempt(r.attempt);
    setMessages(r.messages);
    setClosed(r.closed);
  };

  // Daily progress drives the header strip + the verdict note. Cheap to refetch.
  const refreshProg = async (userId) => {
    try {
      const t = await api.today(userId);
      setProg({ done: t.answered_today, target: t.daily_goal, streak: t.streak_days });
    } catch {}
  };

  // A fresh question of the current mode (the open one if any takes priority).
  const loadFresh = useCallback(async (eff) => {
    setPhase('loading'); setErr(''); setDraft('');
    try {
      const { userId } = await getConfig();
      refreshProg(userId);
      let a = await api.openQuestion(userId);
      if (!a) a = await api.newQuestion(userId, eff ? { mode: eff } : {});
      applyResponse(await api.chatMessages(userId, a.id));
      setPhase('chat');
    } catch (e) { setErr(e.message); setPhase('error'); }
  }, []);

  // Entry point: reopen a specific past conversation, or start a fresh one.
  const start = useCallback(async () => {
    if (!attemptId) return loadFresh(routeMode);
    setPhase('loading'); setErr(''); setDraft('');
    try {
      const { userId } = await getConfig();
      refreshProg(userId);
      applyResponse(await api.chatMessages(userId, attemptId));
      setPhase('chat');
    } catch (e) { setErr(e.message); setPhase('error'); }
  }, [attemptId, routeMode, loadFresh]);

  useEffect(() => { start(); }, [start]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, thinking]);

  // Keep refs in step for the unmount save and append-on-dictate.
  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { attemptIdRef.current = attempt?.id ?? null; }, [attempt?.id]);

  // Restore a saved draft when a question is shown (never clobber live typing).
  useEffect(() => {
    const id = attempt?.id;
    if (!id) return undefined;
    let alive = true;
    AsyncStorage.getItem(`draft:${id}`).then((v) => {
      if (alive && v && !draftRef.current) setDraft(v);
    }).catch(() => {});
    return () => { alive = false; };
  }, [attempt?.id]);

  // Persist the in-progress draft on unmount so leaving never loses your text.
  useEffect(() => () => {
    const id = attemptIdRef.current;
    if (!id) return;
    const v = draftRef.current;
    if (v && v.trim()) AsyncStorage.setItem(`draft:${id}`, v).catch(() => {});
    else AsyncStorage.removeItem(`draft:${id}`).catch(() => {});
  }, []);

  // --- voice: dictation fills the box; it stops ONLY when you tap the mic ----
  useSpeechRecognitionEvent('result', (e) => {
    const t = e.results?.[0]?.transcript ?? '';
    if (!t) return;
    restartsRef.current = 0; // making progress
    const base = baseRef.current;
    const combined = (base ? base + ' ' : '') + t;
    setDraft(combined.trimStart());
    setDictated(true);
    if (e.isFinal) baseRef.current = combined.trim(); // commit this segment
  });
  // The engine ended (silence/timeout/segment). If you haven't tapped stop,
  // restart — a thinking pause must never cut you off.
  useSpeechRecognitionEvent('end', () => {
    if (!wantMicRef.current) { setListening(false); return; }
    // Only a *tight* restart loop (each end < 1.2s after the last) is a problem;
    // periodic silence-restarts during a long pause have big gaps and reset it.
    const now = Date.now();
    restartsRef.current = now - lastEndRef.current < 1200 ? restartsRef.current + 1 : 0;
    lastEndRef.current = now;
    if (restartsRef.current > 8) {
      wantMicRef.current = false; setListening(false);
      setErr('Mic stopped — tap it to start again.');
      return;
    }
    baseRef.current = draftRef.current; // keep what we have; append the next segment
    try { ExpoSpeechRecognitionModule.start(MIC_OPTIONS); }
    catch { wantMicRef.current = false; setListening(false); }
  });
  useSpeechRecognitionEvent('error', (e) => {
    const code = e.error || '';
    // benign "you went quiet" / restart noise: ignore, 'end' handles it. A real
    // problem (permission, etc.): give up and surface it.
    if (code && !['no-speech', 'speech-timeout', 'no-match', 'client', 'aborted'].includes(code)) {
      wantMicRef.current = false;
      setErr(`Microphone: ${e.error || e.message || 'could not hear you'}`);
    }
  });
  useEffect(() => () => {
    wantMicRef.current = false;
    try { ExpoSpeechRecognitionModule.stop(); } catch {}
  }, []);

  const stopMic = () => {
    wantMicRef.current = false;
    try { ExpoSpeechRecognitionModule.stop(); } catch {}
    setListening(false);
  };
  const toggleMic = async () => {
    if (thinking) return;
    if (listening) { stopMic(); return; }
    try {
      const p = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!p.granted) { setErr('Microphone permission denied — enable it in phone settings.'); return; }
      setErr(''); setDictated(false);
      baseRef.current = draft ? draft.trim() : '';  // append to whatever's there
      restartsRef.current = 0;
      wantMicRef.current = true;
      ExpoSpeechRecognitionModule.start(MIC_OPTIONS);
      setListening(true);
    } catch (e) { wantMicRef.current = false; setErr(`Microphone: ${e.message}`); }
  };

  // --- the one send path: text, voice-dictated text, or a photo -------------
  const sendMessage = async ({ text = '', images = null, localUri = null }) => {
    const content = (text ?? '').trim();
    if ((!content && !images) || thinking) return;
    if (listening || wantMicRef.current) { wantMicRef.current = false; try { ExpoSpeechRecognitionModule.stop(); } catch {} setListening(false); }
    setErr(''); setDraft(''); baseRef.current = ''; setThinking(true);
    const sentAttemptId = attempt?.id; if (sentAttemptId) AsyncStorage.removeItem(`draft:${sentAttemptId}`).catch(() => {});
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
      if (r.closed) refreshProg(userId);
    } catch (e) { setErr(e.message); }
    setThinking(false);
  };

  const send = (text) => sendMessage({ text: text ?? draft });

  // --- camera / library: a photo of handwritten work (themed sheet) ---------
  const pickImage = async (source) => {
    setPhotoSheet(false);
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

  // Skip the current question (mastery untouched) and flow straight into the
  // next of the current mode. One tap, no prompt.
  const skipNext = async () => {
    if (thinking) return;
    const skippedId = attempt?.id; if (skippedId) AsyncStorage.removeItem(`draft:${skippedId}`).catch(() => {});
    try { const { userId } = await getConfig(); await api.skip(userId); }
    catch (e) { setErr(e.message); }
    loadFresh(mode);
  };
  // After a question closes, the next one flows in — same mode, one tap.
  const nextQuestion = () => loadFresh(mode);

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
  const pct = prog ? Math.min(100, Math.round(Math.min(prog.done, prog.target) / Math.max(prog.target, 1) * 100)) : 0;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* session header: back · progress */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={10}>
          <Text style={s.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={s.progWrap}>
          <View style={s.progTrack}><View style={[s.progFill, { width: `${pct}%` }]} /></View>
          <Text style={s.progTxt}>{prog ? `${Math.min(prog.done, prog.target)} / ${prog.target}` : ''}</Text>
        </View>
      </View>

      {/* sticky mode toggle — what KIND of question you want right now */}
      <View style={s.modeRow}>
        {MODES.map(([m, emo, lbl]) => {
          const on = mode === m;
          return (
            <TouchableOpacity key={m} onPress={() => setMode(m)} style={[s.modeSeg, on && s.modeSegOn]} activeOpacity={0.85}>
              <Text style={s.segEmo}>{emo}</Text>
              <Text style={[s.modeSegTxt, on && s.modeSegTxtOn]}>{lbl}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
            {prog ? (
              <Text style={s.goalNote}>
                {prog.done >= prog.target
                  ? `🎯 Daily goal complete · 🔥 ${prog.streak}-day streak`
                  : `${prog.done} of ${prog.target} today · 🔥 ${prog.streak}-day streak`}
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
            <Btn label="Next question  ›" onPress={nextQuestion} />
            <Btn label="Done for now" kind="outline" onPress={() => navigation.goBack()} />
          </>
        ) : null}
      </ScrollView>

      <View style={s.composer}>
        {closed ? (
          <View style={s.quickRow}>
            {FOLLOWUP_REPLIES.map((q) => (
              <TouchableOpacity key={q.label} style={s.quickChip} onPress={() => send(q.text)}>
                <Text style={s.quickText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // help ladder — Walk me through it (primary) / Back up to basics / Show me the solution
          <View style={s.helpRow}>
            {HELP_REPLIES.map((q) => (
              <TouchableOpacity
                key={q.label}
                style={[s.helpBtn, q.primary && s.helpBtnPrimary]}
                onPress={() => send(q.text)}
                activeOpacity={0.85}
              >
                <Text style={[s.helpText, q.primary && s.helpTextPrimary]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={s.inputBar}>
          {!closed && (
            <>
              <TouchableOpacity style={s.iconBtn} onPress={() => setPhotoSheet(true)} disabled={thinking}>
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
            placeholder={listening ? 'Listening… take your time — tap the mic when done' : (closed ? 'Any follow-up?' : 'Type, talk, or snap a photo…')}
            placeholderTextColor={colors.inkFaint}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!draft.trim() || thinking) && { opacity: 0.4 }]}
            onPress={() => send()} disabled={!draft.trim() || thinking}
          >
            <Text style={s.sendText}>➤</Text>
          </TouchableOpacity>
        </View>

        {!closed ? (
          <TouchableOpacity style={s.skipRow} onPress={skipNext} disabled={thinking} hitSlop={8}>
            <Text style={s.skipText}>⏭  Skip — next one</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Sheet visible={photoSheet} title="Photo of your work" onClose={() => setPhotoSheet(false)}>
        <Text style={[type.meta, { marginBottom: 12 }]}>Snap your handwritten working and Labib will read it.</Text>
        <Btn label="📷  Take a photo" onPress={() => pickImage('camera')} />
        <Btn label="🖼  Choose from library" kind="outline" onPress={() => pickImage('library')} />
      </Sheet>
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
  // session header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, gap: 10 },
  backBtn: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 30, lineHeight: 32, color: colors.inkSoft, fontWeight: '700' },
  progWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.bgSoft, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  progTxt: { fontSize: 12, fontWeight: '800', color: colors.inkSoft, minWidth: 34, textAlign: 'right' },
  segEmo: { fontSize: 13 },
  // 3-way sticky mode toggle (full-width row under the header)
  modeRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 15, paddingTop: 6, paddingBottom: 2 },
  modeSeg: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, borderRadius: 11, backgroundColor: colors.bgSoft,
    borderWidth: 1, borderColor: colors.line,
  },
  modeSegOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeSegTxt: { fontSize: 11.5, fontWeight: '800', color: colors.inkSoft },
  modeSegTxtOn: { color: '#231a0a' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: pad, paddingTop: 6 },
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
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  questionLabel: { fontSize: 11, fontWeight: '800', color: colors.primaryDark, marginBottom: 4, letterSpacing: 1 },
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
  // two help buttons
  helpRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  helpBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4,
    minHeight: 56, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, ...shadow.sm,
  },
  helpBtnPrimary: { borderColor: colors.primary, backgroundColor: colors.primary + '1F' },
  helpText: { fontSize: 11.5, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  helpTextPrimary: { color: colors.primaryDark },
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
  sendText: { color: '#231a0a', fontSize: 18, fontWeight: '800' },
  skipRow: { alignItems: 'center', paddingTop: 9, paddingBottom: 2 },
  skipText: { fontSize: 12.5, fontWeight: '700', color: colors.inkSoft },
});
