// Progress: the big picture - streak, totals, a week of activity, then
// per-course mastery with the weakest skills surfaced first.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig } from '../api';
import { Card, Chip, Bar, ErrorText, EmptyState, SectionTitle } from '../components';
import { colors, pad, type, utcDate, dayLabel } from '../theme';
import { VERDICTS } from '../labels';
import { masteryRank } from '../brand';

export default function ProgressScreen({ navigation }) {
  const [enrollments, setEnrollments] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      const { userId } = await getConfig();
      const [prog, hist, t] = await Promise.all([
        api.progress(userId), api.attempts(userId, 100), api.today(userId),
      ]);
      setEnrollments(prog.enrollments);
      setAttempts(hist);
      setTodayData(t);
    } catch (e) { setErr(e.message); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const answered = attempts.filter((a) => a.answered_at);
  const correct = answered.filter((a) => a.verdict === 'correct').length;

  // last 7 days activity
  const week = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const count = answered.filter((a) => utcDate(a.answered_at)?.toDateString() === key).length;
    return { label: 'SMTWTFS'[d.getDay()], count };
  });
  const weekMax = Math.max(1, ...week.map((w) => w.count));

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ padding: pad, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <ErrorText>{err}</ErrorText>

      {/* headline stats */}
      <View style={s.statsRow}>
        <StatBox emoji="🔥" value={todayData?.streak_days ?? '–'} label="streak" />
        <StatBox emoji="✅" value={answered.length} label="answered" />
        <StatBox emoji="🎯" value={answered.length ? `${Math.round((correct / answered.length) * 100)}%` : '–'} label="correct" />
      </View>

      {/* weekly activity */}
      <SectionTitle>This week</SectionTitle>
      <Card>
        <View style={s.weekRow}>
          {week.map((w, i) => (
            <View key={i} style={s.weekCol}>
              <View style={s.weekBarArea}>
                <View style={[s.weekBar, {
                  height: `${Math.round((w.count / weekMax) * 100)}%`,
                  backgroundColor: w.count > 0 ? colors.primary : colors.line,
                  minHeight: 6,
                }]} />
              </View>
              <Text style={s.weekLabel}>{w.label}</Text>
              <Text style={s.weekCount}>{w.count || ''}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* per course */}
      {enrollments !== null && enrollments.length === 0 ? (
        <EmptyState emoji="📚" title="No courses yet" hint="Enroll in one and progress shows up here." />
      ) : null}
      {(enrollments || []).map((enr) => {
        const skills = [...enr.skills].sort((a, b) => a.score - b.score);
        return (
          <View key={enr.enrollment_id}>
            <SectionTitle right={<Chip text={`${Math.round(enr.avg_score * 100)}% avg`}
              color={enr.avg_score >= 0.7 ? colors.good : enr.avg_score >= 0.4 ? colors.warn : colors.bad} />}>
              {enr.program_title}
            </SectionTitle>
            <Card>
              {skills.length === 0 ? (
                <Text style={type.meta}>Answer a first question to start tracking.</Text>
              ) : skills.map((sk) => (
                <View key={sk.skill_id} style={s.skillRow}>
                  <Text style={s.skillName} numberOfLines={1}>
                    {sk.name}{masteryRank(sk.score) ? `  ·  ${masteryRank(sk.score)}` : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Bar value={sk.score} height={8} />
                    <Text style={s.skillPct}>{Math.round(sk.score * 100)}%</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        );
      })}

      {/* recent history */}
      {answered.length > 0 && (
        <>
          <SectionTitle>History</SectionTitle>
          {answered.slice(0, 15).map((a) => {
            const v = VERDICTS[a.verdict] || VERDICTS.skipped;
            return (
              <TouchableOpacity key={a.id} activeOpacity={0.7}
                onPress={() => navigation.navigate('Practice', { attemptId: a.id })}>
                <Card style={{ paddingVertical: 10 }}>
                  <View style={s.histHead}>
                    <Text style={s.histSkill}>{v.emoji} {a.skill_name || 'Question'}  ›</Text>
                    <Text style={type.meta}>{dayLabel(a.answered_at)}</Text>
                  </View>
                  <Text style={type.meta} numberOfLines={2}>{a.question}</Text>
                </Card>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function StatBox({ emoji, value, label }) {
  return (
    <View style={s.statBox}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, alignItems: 'center', backgroundColor: colors.bgSoft,
    borderRadius: 16, paddingVertical: 12,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 2 },
  statLabel: { fontSize: 11, color: colors.inkSoft },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', height: 110 },
  weekCol: { flex: 1, alignItems: 'center' },
  weekBarArea: { flex: 1, width: 16, justifyContent: 'flex-end' },
  weekBar: { width: 16, borderRadius: 8 },
  weekLabel: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, marginTop: 6 },
  weekCount: { fontSize: 10, color: colors.inkFaint, height: 13 },
  skillRow: { marginBottom: 12 },
  skillName: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  skillPct: { marginLeft: 8, fontSize: 12, fontWeight: '800', color: colors.inkSoft, width: 38, textAlign: 'right' },
  histHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  histSkill: { fontWeight: '700', color: colors.ink, flexShrink: 1, marginRight: 8 },
});
