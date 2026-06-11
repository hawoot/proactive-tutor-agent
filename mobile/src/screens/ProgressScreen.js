// Mastery per skill per enrollment, plus recent attempt history.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig } from '../api';
import { Card, Bar, Tag, ErrorText, EmptyText } from '../components';
import { colors, pad } from '../theme';

export default function ProgressScreen() {
  const [data, setData] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      const { userId } = await getConfig();
      const [prog, hist] = await Promise.all([api.progress(userId), api.attempts(userId, 15)]);
      setData(prog.enrollments);
      setAttempts(hist);
    } catch (e) { setErr(e.message); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const verdictColor = { correct: colors.good, partial: colors.warn, wrong: colors.bad, skipped: colors.inkSoft };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ padding: pad, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <ErrorText>{err}</ErrorText>
      {data !== null && data.length === 0
        ? <EmptyText>Not enrolled in anything yet - pick a program in the Library.</EmptyText> : null}

      {(data || []).map((enr) => (
        <Card key={enr.enrollment_id}>
          <View style={s.head}>
            <Text style={s.title}>{enr.program_title}</Text>
            <Tag text={`${Math.round(enr.avg_score * 100)}% avg`}
              color={enr.avg_score >= 0.7 ? colors.good : enr.avg_score >= 0.4 ? colors.warn : colors.bad} />
          </View>
          {enr.exam_date ? <Text style={s.meta}>Exam: {enr.exam_date.slice(0, 10)}</Text> : null}
          {enr.skills.length === 0
            ? <Text style={s.meta}>No skills tracked yet - answer a first question.</Text> : null}
          {enr.skills.map((sk) => (
            <View key={sk.skill_id} style={s.skillRow}>
              <Text style={s.skillName}>{sk.name}</Text>
              <Bar value={sk.score} />
              <Text style={s.meta}>
                {Math.round(sk.score * 100)}% · {sk.attempts} attempts ({sk.correct} correct)
                {sk.due_at ? ` · next review ${sk.due_at.slice(0, 10)}` : ''}
              </Text>
            </View>
          ))}
        </Card>
      ))}

      {attempts.length > 0 && (
        <>
          <Text style={s.section}>Recent activity</Text>
          {attempts.map((a) => (
            <Card key={a.id} style={s.attemptCard}>
              <View style={s.head}>
                <Text style={s.meta}>{a.asked_at.slice(0, 16).replace('T', ' ')}</Text>
                <Tag text={a.verdict || 'open'} color={verdictColor[a.verdict] || colors.shared} />
              </View>
              {a.skill_name ? <Text style={s.skillName}>{a.skill_name}</Text> : null}
              <Text style={s.question} numberOfLines={3}>{a.question}</Text>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, flexShrink: 1, marginRight: 8 },
  section: {
    fontSize: 14, fontWeight: '700', color: colors.inkSoft,
    marginTop: 18, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  skillRow: { marginTop: 12 },
  skillName: { fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 2 },
  meta: { fontSize: 12, color: colors.inkSoft },
  attemptCard: { paddingVertical: 10 },
  question: { color: colors.inkSoft, marginTop: 4, fontSize: 13, lineHeight: 18 },
});
