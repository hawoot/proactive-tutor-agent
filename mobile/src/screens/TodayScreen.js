// Home = the agent's plan, made visible. Streak + daily goal up top, ONE
// hero action, then the timeline: what's coming, what just happened.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig } from '../api';
import { Btn, Card, Chip, Bar, ErrorText, EmptyState, SectionTitle, Mascot } from '../components';
import { colors, pad, type, timeOfDay, dayLabel } from '../theme';
import { VERDICTS } from '../labels';
import { greeting } from '../brand';

export default function TodayScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      const { userId } = await getConfig();
      setData(await api.today(userId));
    } catch (e) { setErr(e.message); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const practice = (effort) => navigation.navigate('Practice', { effort });

  // Dismiss the waiting question (mastery untouched) then either start a new
  // one of the chosen kind, or just clear it and stay here.
  const skipOpenThen = (effort, go) => async () => {
    try { const { userId } = await getConfig(); await api.skip(userId); } catch {}
    if (go) navigation.navigate('Practice', { effort }); else load();
  };
  const dismissOpen = () => {
    Alert.alert('Skip this question?', 'Remove it — what would you like instead?', [
      { text: '⚡ Quick one', onPress: skipOpenThen('quick', true) },
      { text: '🧠 Deep dive', onPress: skipOpenThen('deep', true) },
      { text: 'Just remove it', onPress: skipOpenThen(null, false) },
    ]);
  };

  const goalDone = data && data.answered_today >= data.daily_goal;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ padding: pad, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <ErrorText>{err}</ErrorText>
      {!data && !err ? <EmptyState pose="think" title="Loading your day…" /> : null}

      {data && (
        <>
          {/* Nejma says hello */}
          <GreetingRow goalDone={goalDone} />

          {/* streak + daily goal */}
          <View style={s.statsRow}>
            <View style={s.streakBox}>
              <Text style={s.streakEmoji}>🔥</Text>
              <Text style={s.streakNum}>{data.streak_days}</Text>
              <Text style={s.streakLabel}>day streak</Text>
            </View>
            <View style={s.goalBox}>
              <Text style={s.goalText}>
                {goalDone ? '🎯 Daily goal done!' : `Today: ${data.answered_today} / ${data.daily_goal}`}
              </Text>
              <Bar value={data.answered_today / Math.max(data.daily_goal, 1)} color={colors.primary} height={8} />
            </View>
          </View>

          {/* hero: the one thing to do now */}
          {!data.has_active_enrollment ? (
            <Card tint={colors.blue}>
              <Text style={s.heroTitle}>👋 Welcome!</Text>
              <Text style={type.body}>Pick a course and Nejma starts planning your practice.</Text>
              <Btn label="Browse courses" color="blue" onPress={() => navigation.navigate('Courses')} />
            </Card>
          ) : data.open_attempt ? (
            <Card tint={colors.primary}>
              <View style={s.chipRow}>
                {data.open_attempt.skill_name ? <Chip text={data.open_attempt.skill_name} color={colors.blue} /> : null}
                <Chip text={data.open_attempt.from_bank ? 'curated' : 'AI-generated'}
                  color={data.open_attempt.from_bank ? colors.good : colors.purple} />
              </View>
              <Text style={s.heroTitle}>A question is waiting</Text>
              <Text style={type.body} numberOfLines={3}>{data.open_attempt.question}</Text>
              <Btn label="Answer now" onPress={() => practice(null)} />
              <Btn label="Skip this one" kind="outline" onPress={dismissOpen} />
            </Card>
          ) : data.due_now > 0 ? (
            <Card tint={colors.orange}>
              <Text style={s.heroTitle}>📚 {data.due_now} skill{data.due_now > 1 ? 's' : ''} ready for review</Text>
              <Text style={type.body}>Reviewing on time is what makes it stick.</Text>
              <Btn label="Practice now" color="orange" onPress={() => practice(null)} />
            </Card>
          ) : (
            <Card tint={colors.primary}>
              <Text style={s.heroTitle}>✅ All caught up</Text>
              <Text style={type.body}>
                {data.next_nudge_at
                  ? `Nejma plans to ping you around ${timeOfDay(data.next_nudge_at)}.`
                  : 'Nejma will schedule the next nudge shortly.'}
              </Text>
              <Btn label="Practice anyway" kind="outline" onPress={() => practice(null)} />
            </Card>
          )}

          {/* quick/deep on-demand */}
          {data.has_active_enrollment && !data.open_attempt ? (
            <View style={s.quickRow}>
              <TouchableOpacity style={s.quickBtn} onPress={() => practice('quick')}>
                <Text style={s.quickText}>⚡ Quick one</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.quickBtn} onPress={() => practice('deep')}>
                <Text style={s.quickText}>🧠 Deep dive</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* timeline: coming up */}
          <SectionTitle>Coming up</SectionTitle>
          {data.next_nudge_at ? (
            <TimelineItem emoji="⏰" color={colors.blue}
              title={`Next nudge ~ ${timeOfDay(data.next_nudge_at)}`}
              sub="Nejma decides then whether to ping you" />
          ) : null}
          {data.due_today > data.due_now ? (
            <TimelineItem emoji="📚" color={colors.orange}
              title={`${data.due_today - data.due_now} more review${data.due_today - data.due_now > 1 ? 's' : ''} due later today`}
              sub="They'll appear here when ready" />
          ) : null}
          {data.exams.map((e) => (
            <TimelineItem key={e.enrollment_id} emoji="🎯"
              color={e.days_left <= 7 ? colors.red : e.days_left <= 30 ? colors.orange : colors.purple}
              title={`${e.days_left} days until your ${e.program_title} exam`}
              sub={e.days_left <= 30 ? 'Nudges are ramping up' : 'Plenty of runway - keep the streak'} />
          ))}
          {!data.next_nudge_at && data.due_today === 0 && data.exams.length === 0 ? (
            <Text style={type.meta}>Nothing scheduled yet - enroll in a course or practice on demand.</Text>
          ) : null}

          {/* timeline: earlier */}
          {data.recent.length > 0 && (
            <>
              <SectionTitle>Earlier</SectionTitle>
              {data.recent.map((a) => {
                const v = VERDICTS[a.verdict] || VERDICTS.skipped;
                return (
                  <TimelineItem key={a.id} emoji={v.emoji} color={v.color}
                    title={a.skill_name || 'Practice question'}
                    sub={`${v.label} · ${dayLabel(a.answered_at || a.asked_at)} · tap to revisit`}
                    onPress={() => navigation.navigate('Practice', { attemptId: a.id })} />
                );
              })}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function GreetingRow({ goalDone }) {
  const g = greeting(new Date().getHours());
  const pose = goalDone ? 'celebrate' : g.pose;
  const line = goalDone ? 'Tnejjem! Goal done ⭐' : g.line;
  const sub = goalDone ? 'You said you couldn’t. Nejma disagreed. Extra is a bonus.' : g.sub;
  return (
    <View style={s.greetRow}>
      <Mascot pose={pose} size={72} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.greetLine}>{line}</Text>
        <Text style={type.meta}>{sub}</Text>
      </View>
    </View>
  );
}

function TimelineItem({ emoji, color, title, sub, onPress }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={s.tlRow} onPress={onPress} activeOpacity={0.7}>
      <View style={s.tlRail}>
        <View style={[s.tlDot, { backgroundColor: (color || colors.line) + '22', borderColor: color || colors.line }]}>
          <Text style={{ fontSize: 15 }}>{emoji}</Text>
        </View>
        <View style={s.tlLine} />
      </View>
      <View style={s.tlContent}>
        <Text style={s.tlTitle}>{title}{onPress ? '  ›' : ''}</Text>
        {sub ? <Text style={type.meta}>{sub}</Text> : null}
      </View>
    </Wrap>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  greetLine: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 2 },
  statsRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'stretch' },
  streakBox: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
    backgroundColor: colors.orange + '14', borderRadius: 18, marginRight: 10,
    paddingVertical: 8,
  },
  streakEmoji: { fontSize: 20 },
  streakNum: { fontSize: 22, fontWeight: '800', color: colors.orangeDark },
  streakLabel: { fontSize: 11, color: colors.inkSoft },
  goalBox: { flex: 1, justifyContent: 'center' },
  goalText: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 6, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  quickBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderWidth: 2, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.card,
  },
  quickText: { fontWeight: '700', color: colors.ink },
  tlRow: { flexDirection: 'row', marginBottom: 2 },
  tlRail: { alignItems: 'center', width: 44 },
  tlDot: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tlLine: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: 2 },
  tlContent: { flex: 1, paddingLeft: 10, paddingBottom: 18, paddingTop: 4 },
  tlTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
