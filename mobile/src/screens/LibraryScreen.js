// The content library: shared programs + your personal ones.
// Create new programs here; tap one to manage its units/skills and enroll.
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig } from '../api';
import { Btn, Card, Field, Tag, Sheet, ErrorText, EmptyText } from '../components';
import { colors, pad } from '../theme';

export default function LibraryScreen({ navigation }) {
  const [programs, setPrograms] = useState(null);
  const [userId, setUserId] = useState(1);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      const { userId: uid } = await getConfig();
      setUserId(uid);
      setPrograms(await api.listPrograms(uid));
    } catch (e) { setErr(e.message); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const shared = (programs || []).filter((p) => p.owner_id === null);
  const mine = (programs || []).filter((p) => p.owner_id !== null);

  const ProgramCard = ({ p }) => (
    <TouchableOpacity onPress={() => navigation.navigate('Program', { id: p.id, title: p.title })}>
      <Card>
        <View style={s.cardHead}>
          <Text style={s.title}>{p.title}</Text>
          {p.enrolled ? <Tag text="enrolled" color={colors.good} /> : null}
        </View>
        <View style={s.tagRow}>
          <Tag
            text={p.owner_id === null ? 'shared' : 'personal'}
            color={p.owner_id === null ? colors.shared : colors.personal}
          />
          {p.level ? <Tag text={p.level} /> : null}
          {p.region ? <Tag text={p.region} /> : null}
        </View>
        <Text style={s.meta}>{p.unit_count} units · {p.skill_count} skills</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ padding: pad, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <ErrorText>{err}</ErrorText>
        <Btn label="+ New program" onPress={() => setEditorOpen(true)} />

        <Text style={s.section}>My programs</Text>
        {mine.length === 0 && programs !== null
          ? <EmptyText>Nothing personal yet - create one, or clone a shared program.</EmptyText>
          : mine.map((p) => <ProgramCard key={p.id} p={p} />)}

        <Text style={s.section}>Shared library</Text>
        {shared.length === 0 && programs !== null
          ? <EmptyText>No shared programs. Seed demo data from Settings, or create one.</EmptyText>
          : shared.map((p) => <ProgramCard key={p.id} p={p} />)}
      </ScrollView>

      <ProgramEditor
        visible={editorOpen}
        userId={userId}
        onClose={() => setEditorOpen(false)}
        onSaved={() => { setEditorOpen(false); load(); }}
      />
    </View>
  );
}

function ProgramEditor({ visible, userId, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const [personal, setPersonal] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!title.trim()) { setErr('Title is required.'); return; }
    setBusy(true); setErr('');
    try {
      await api.createProgram({
        title: title.trim(), subject, level, region, description,
        owner_id: personal ? userId : null,
      });
      setTitle(''); setSubject(''); setLevel(''); setRegion(''); setDescription('');
      onSaved();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title="New program" onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Field label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. A-level Physics" />
      <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="physics" />
      <Field label="Level" value={level} onChangeText={setLevel} placeholder="A-level" />
      <Field label="Region" value={region} onChangeText={setRegion} placeholder="UK" />
      <Field label="Description" value={description} onChangeText={setDescription} multiline />
      <View style={s.switchRow}>
        <Text style={s.switchLabel}>
          {personal ? 'Personal (only you see it)' : 'Shared (in the library for everyone)'}
        </Text>
        <Switch value={personal} onValueChange={setPersonal} />
      </View>
      <Btn label="Create program" onPress={save} busy={busy} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  section: {
    fontSize: 14, fontWeight: '700', color: colors.inkSoft,
    marginTop: 18, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: colors.ink, flexShrink: 1 },
  tagRow: { flexDirection: 'row', marginTop: 6 },
  meta: { fontSize: 12, color: colors.inkSoft, marginTop: 6 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginVertical: 10,
  },
  switchLabel: { color: colors.ink, flexShrink: 1, marginRight: 10 },
});
