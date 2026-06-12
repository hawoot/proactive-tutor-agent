// Courses: my enrolled courses with progress first, then the library to
// explore. Creating your own course lives here too (your personal space).
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig } from '../api';
import { Btn, Card, Chip, Bar, Field, Sheet, ErrorText, EmptyState, SectionTitle } from '../components';
import { colors, pad, type } from '../theme';

export default function CoursesScreen({ navigation }) {
  const [programs, setPrograms] = useState(null);
  const [progressByProgram, setProgressByProgram] = useState({});
  const [userId, setUserId] = useState(1);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      const { userId: uid } = await getConfig();
      setUserId(uid);
      const [progs, prog] = await Promise.all([api.listPrograms(uid), api.progress(uid)]);
      setPrograms(progs);
      const map = {};
      for (const e of prog.enrollments) map[e.program_id] = e;
      setProgressByProgram(map);
    } catch (e) { setErr(e.message); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const mine = (programs || []).filter((p) => p.enrolled);
  const explore = (programs || []).filter((p) => !p.enrolled);

  const open = (p) => navigation.navigate('Course', { id: p.id, title: p.title });

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ padding: pad, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <ErrorText>{err}</ErrorText>

        {programs !== null && mine.length === 0 && explore.length === 0 ? (
          <EmptyState emoji="📚" title="No courses yet"
            hint="Create one below, or seed the demo course from Settings." />
        ) : null}

        {mine.length > 0 && <SectionTitle>My courses</SectionTitle>}
        {mine.map((p) => {
          const enr = progressByProgram[p.id];
          return (
            <TouchableOpacity key={p.id} onPress={() => open(p)} activeOpacity={0.85}>
              <Card>
                <View style={s.headRow}>
                  <Text style={s.title}>{p.title}</Text>
                  {enr?.status === 'paused' ? <Chip text="paused" color={colors.orange} /> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Bar value={enr?.avg_score || 0} />
                  <Text style={s.pct}>{Math.round((enr?.avg_score || 0) * 100)}%</Text>
                </View>
                <Text style={[type.meta, { marginTop: 6 }]}>
                  {p.skill_count} skills{enr?.exam_date ? ` · exam ${enr.exam_date.slice(0, 10)}` : ''}
                </Text>
              </Card>
            </TouchableOpacity>
          );
        })}

        {explore.length > 0 && <SectionTitle>Explore</SectionTitle>}
        {explore.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => open(p)} activeOpacity={0.85}>
            <Card>
              <View style={s.headRow}>
                <Text style={s.title}>{p.title}</Text>
                <Chip text={p.owner_id === null ? 'library' : 'mine'}
                  color={p.owner_id === null ? colors.shared : colors.personal} />
              </View>
              {p.description ? (
                <Text style={[type.meta, { marginTop: 4 }]} numberOfLines={2}>{p.description}</Text>
              ) : null}
              <Text style={[type.meta, { marginTop: 6 }]}>
                {p.unit_count} topics · {p.skill_count} skills
              </Text>
            </Card>
          </TouchableOpacity>
        ))}

        <View style={{ marginTop: 14 }}>
          <Btn label="+ Create my own course" kind="outline" onPress={() => setCreatorOpen(true)} />
        </View>
      </ScrollView>

      <CourseCreator
        visible={creatorOpen} userId={userId}
        onClose={() => setCreatorOpen(false)}
        onSaved={(p) => { setCreatorOpen(false); load(); navigation.navigate('Course', { id: p.id, title: p.title }); }}
      />
    </View>
  );
}

function CourseCreator({ visible, userId, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [personal, setPersonal] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!title.trim()) { setErr('Give it a title.'); return; }
    setBusy(true); setErr('');
    try {
      const p = await api.createProgram({
        title: title.trim(), subject, level, description,
        owner_id: personal ? userId : null,
      });
      setTitle(''); setSubject(''); setLevel(''); setDescription('');
      onSaved(p);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title="New course" onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Spanish vocabulary" />
      <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="optional" />
      <Field label="Level" value={level} onChangeText={setLevel} placeholder="optional" />
      <Field label="Description" value={description} onChangeText={setDescription} multiline />
      <View style={s.switchRow}>
        <Text style={{ ...type.body, flex: 1, marginRight: 10 }}>
          {personal ? 'Private - only you see it' : 'Shared - goes in the library'}
        </Text>
        <Switch value={personal} onValueChange={setPersonal}
          trackColor={{ true: colors.primary }} />
      </View>
      <Btn label="Create course" onPress={save} busy={busy} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: colors.ink, flexShrink: 1, marginRight: 8 },
  pct: { marginLeft: 10, fontWeight: '800', color: colors.ink, width: 44, textAlign: 'right' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
});
