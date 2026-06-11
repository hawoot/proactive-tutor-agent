// One program: enroll/exam date, clone, and full content control -
// add/edit/delete units (nested) and skills, plus private notes on units.
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig } from '../api';
import { Btn, Card, Field, Tag, Sheet, Choice, ErrorText, EmptyText } from '../components';
import { colors, pad } from '../theme';

export default function ProgramScreen({ route, navigation }) {
  const programId = route.params.id;
  const [userId, setUserId] = useState(1);
  const [program, setProgram] = useState(null);
  const [tree, setTree] = useState(null);
  const [looseSkills, setLooseSkills] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [notes, setNotes] = useState([]);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editor, setEditor] = useState(null); // {type: 'unit'|'skill'|'note'|'exam', ...payload}

  const load = useCallback(async () => {
    setErr('');
    try {
      const { userId: uid } = await getConfig();
      setUserId(uid);
      const [programs, treeData, skills, enrollments, noteList] = await Promise.all([
        api.listPrograms(uid),
        api.programTree(programId),
        api.programSkills(programId),
        api.listEnrollments(uid),
        api.listNotes(uid),
      ]);
      const prog = programs.find((p) => p.id === programId);
      if (!prog) { setErr('Program not found (was it deleted?).'); return; }
      setProgram(prog);
      setTree(treeData);
      const unitSkillIds = new Set();
      const collect = (nodes) => nodes.forEach((n) => {
        n.skills.forEach((sk) => unitSkillIds.add(sk.id));
        collect(n.children);
      });
      collect(treeData);
      setLooseSkills(skills.filter((sk) => !unitSkillIds.has(sk.id)));
      setEnrollment(enrollments.find((e) => e.program_id === programId) || null);
      setNotes(noteList);
    } catch (e) { setErr(e.message); }
  }, [programId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const canEdit = program && (program.owner_id === null || program.owner_id === userId);

  const confirmDelete = (what, fn) => {
    Alert.alert(`Delete ${what}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: fn },
    ]);
  };

  const act = async (fn) => {
    setErr('');
    try { await fn(); await load(); } catch (e) { setErr(e.message); }
  };

  const enroll = () => act(() => api.enroll(userId, programId));
  const unenroll = () => act(() => api.unenroll(enrollment.id));
  const pauseResume = () => act(() => api.updateEnrollment(enrollment.id, {
    status: enrollment.status === 'active' ? 'paused' : 'active',
  }));
  const clone = () => act(async () => {
    const copy = await api.cloneProgram(programId, userId);
    navigation.replace('Program', { id: copy.id, title: copy.title });
  });
  const deleteProgram = () => confirmDelete('program', () => act(async () => {
    await api.deleteProgram(programId, userId);
    navigation.goBack();
  }));

  if (!program) {
    return (
      <View style={s.root}>
        <ScrollView contentContainerStyle={{ padding: pad }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          <ErrorText>{err}</ErrorText>
          {!err && <EmptyText>Loading…</EmptyText>}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ padding: pad, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <ErrorText>{err}</ErrorText>

        {/* header card: meta + enrollment controls */}
        <Card>
          <View style={s.tagRow}>
            <Tag
              text={program.owner_id === null ? 'shared' : 'personal'}
              color={program.owner_id === null ? colors.shared : colors.personal}
            />
            {program.level ? <Tag text={program.level} /> : null}
            {program.region ? <Tag text={program.region} /> : null}
          </View>
          {program.description ? <Text style={s.desc}>{program.description}</Text> : null}

          {enrollment ? (
            <>
              <Text style={s.enrollInfo}>
                {enrollment.status === 'active' ? '✓ Enrolled' : `Enrollment ${enrollment.status}`}
                {enrollment.exam_date ? ` · exam ${enrollment.exam_date.slice(0, 10)}` : ' · no exam date'}
              </Text>
              <View style={s.btnRow}>
                <View style={s.btnHalf}><Btn small label={enrollment.status === 'active' ? 'Pause' : 'Resume'} onPress={pauseResume} kind="secondary" /></View>
                <View style={s.btnHalf}><Btn small label="Set exam date" onPress={() => setEditor({ type: 'exam' })} kind="secondary" /></View>
              </View>
              <Btn small label="Unenroll" onPress={() => confirmDelete('enrollment', unenroll)} kind="danger" />
            </>
          ) : (
            <Btn label="Enroll - the agent starts chasing you" onPress={enroll} />
          )}
        </Card>

        {/* content tree */}
        <View style={s.sectionRow}>
          <Text style={s.section}>Content</Text>
          {canEdit && (
            <TouchableOpacity onPress={() => setEditor({ type: 'unit', parentId: null })}>
              <Text style={s.addLink}>+ add unit</Text>
            </TouchableOpacity>
          )}
        </View>
        {tree && tree.length === 0 && looseSkills.length === 0
          ? <EmptyText>No content yet. Add a unit to start the tree.</EmptyText> : null}
        {(tree || []).map((node) => (
          <UnitNode
            key={node.id} node={node} depth={0} canEdit={canEdit} notes={notes}
            onEditUnit={(u) => setEditor({ type: 'unit', unit: u })}
            onAddChild={(u) => setEditor({ type: 'unit', parentId: u.id })}
            onDeleteUnit={(u) => confirmDelete('unit (and everything inside)', () =>
              act(() => api.deleteUnit(u.id, userId)))}
            onAddSkill={(u) => setEditor({ type: 'skill', unitId: u.id })}
            onEditSkill={(sk) => setEditor({ type: 'skill', skill: sk })}
            onDeleteSkill={(sk) => confirmDelete('skill', () =>
              act(() => api.deleteSkill(sk.id, userId)))}
            onNote={(u, existing) => setEditor({ type: 'note', unitId: u.id, note: existing })}
          />
        ))}

        {looseSkills.length > 0 && (
          <>
            <Text style={s.section}>Skills without a unit</Text>
            {looseSkills.map((sk) => (
              <SkillRow key={sk.id} skill={sk} canEdit={canEdit}
                onEdit={() => setEditor({ type: 'skill', skill: sk })}
                onDelete={() => confirmDelete('skill', () => act(() => api.deleteSkill(sk.id, userId)))}
              />
            ))}
          </>
        )}
        {canEdit && (
          <Btn small kind="secondary" label="+ add skill (no unit)"
            onPress={() => setEditor({ type: 'skill', unitId: null })} />
        )}

        {/* program-level actions */}
        <Text style={s.section}>Program actions</Text>
        <Btn small kind="secondary" label="Clone into my programs" onPress={clone} />
        {canEdit && (
          <Btn small kind="danger" label="Delete program" onPress={deleteProgram} />
        )}
      </ScrollView>

      {/* editors */}
      <UnitEditor
        visible={editor?.type === 'unit'} editor={editor} programId={programId} userId={userId}
        onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }}
      />
      <SkillEditor
        visible={editor?.type === 'skill'} editor={editor} programId={programId} userId={userId}
        onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }}
      />
      <NoteEditor
        visible={editor?.type === 'note'} editor={editor} userId={userId}
        onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }}
      />
      <ExamDateEditor
        visible={editor?.type === 'exam'} enrollment={enrollment}
        onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }}
      />
    </View>
  );
}

// --- tree rendering ----------------------------------------------------------

function UnitNode({ node, depth, canEdit, notes, ...handlers }) {
  const [open, setOpen] = useState(depth < 2);
  const myNote = notes.find((n) => n.unit_id === node.id);
  return (
    <View style={{ marginLeft: depth * 14 }}>
      <Card style={s.unitCard}>
        <TouchableOpacity onPress={() => setOpen(!open)}>
          <View style={s.unitHead}>
            <Text style={s.unitTitle}>
              {node.children.length || node.skills.length ? (open ? '▾ ' : '▸ ') : '· '}
              {node.title}
            </Text>
            {myNote ? <Tag text="note" color={colors.personal} /> : null}
          </View>
        </TouchableOpacity>
        {open && node.content ? <Text style={s.unitContent}>{node.content}</Text> : null}
        {open && myNote ? <Text style={s.noteText}>📝 {myNote.body}</Text> : null}
        {open && (
          <View style={s.unitActions}>
            {canEdit && <ActionLink label="edit" onPress={() => handlers.onEditUnit(node)} />}
            {canEdit && <ActionLink label="+ sub-unit" onPress={() => handlers.onAddChild(node)} />}
            {canEdit && <ActionLink label="+ skill" onPress={() => handlers.onAddSkill(node)} />}
            <ActionLink label={myNote ? 'edit note' : '+ note'}
              onPress={() => handlers.onNote(node, myNote)} />
            {canEdit && <ActionLink label="delete" danger onPress={() => handlers.onDeleteUnit(node)} />}
          </View>
        )}
      </Card>
      {open && node.skills.map((sk) => (
        <View key={sk.id} style={{ marginLeft: 14 }}>
          <SkillRow skill={sk} canEdit={canEdit}
            onEdit={() => handlers.onEditSkill(sk)}
            onDelete={() => handlers.onDeleteSkill(sk)} />
        </View>
      ))}
      {open && node.children.map((child) => (
        <UnitNode key={child.id} node={child} depth={depth + 1}
          canEdit={canEdit} notes={notes} {...handlers} />
      ))}
    </View>
  );
}

function SkillRow({ skill, canEdit, onEdit, onDelete }) {
  return (
    <Card style={s.skillCard}>
      <View style={s.unitHead}>
        <Text style={s.skillName}>🎯 {skill.name}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Tag text={skill.question_type} />
          <Tag text={skill.effort} color={skill.effort === 'deep' ? colors.warn : colors.good} />
        </View>
      </View>
      {canEdit && (
        <View style={s.unitActions}>
          <ActionLink label="edit" onPress={onEdit} />
          <ActionLink label="delete" danger onPress={onDelete} />
        </View>
      )}
    </Card>
  );
}

function ActionLink({ label, onPress, danger }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.actionLink}>
      <Text style={[s.actionText, danger && { color: colors.bad }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// --- editors -------------------------------------------------------------------

function UnitEditor({ visible, editor, programId, userId, onClose, onSaved }) {
  const unit = editor?.unit;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  React.useEffect(() => {
    setTitle(unit?.title || ''); setContent(unit?.content || ''); setErr('');
  }, [editor]);

  const save = async () => {
    if (!title.trim()) { setErr('Title is required.'); return; }
    setBusy(true); setErr('');
    try {
      if (unit) await api.updateUnit(unit.id, userId, { title: title.trim(), content });
      else await api.createUnit(userId, {
        program_id: programId, parent_id: editor?.parentId ?? null,
        title: title.trim(), content,
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title={unit ? 'Edit unit' : 'New unit'} onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Field label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Calculus" />
      <Field label="Material / notes" value={content} onChangeText={setContent} multiline
        placeholder="Curated content the agent can set questions from…" />
      <Btn label={unit ? 'Save changes' : 'Add unit'} onPress={save} busy={busy} />
    </Sheet>
  );
}

const QUESTION_TYPES = ['numeric', 'symbolic', 'mcq', 'code', 'rubric']
  .map((v) => ({ value: v, label: v }));

function SkillEditor({ visible, editor, programId, userId, onClose, onSaved }) {
  const skill = editor?.skill;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [qtype, setQtype] = useState('numeric');
  const [effort, setEffort] = useState('quick');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  React.useEffect(() => {
    setName(skill?.name || ''); setDescription(skill?.description || '');
    setQtype(skill?.question_type || 'numeric'); setEffort(skill?.effort || 'quick');
    setErr('');
  }, [editor]);

  const save = async () => {
    if (!name.trim()) { setErr('Name is required.'); return; }
    setBusy(true); setErr('');
    try {
      const payload = { name: name.trim(), description, question_type: qtype, effort };
      if (skill) await api.updateSkill(skill.id, userId, payload);
      else await api.createSkill(userId, {
        ...payload, program_id: programId, unit_id: editor?.unitId ?? null,
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title={skill ? 'Edit skill' : 'New skill'} onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Field label="Name *" value={name} onChangeText={setName} placeholder="e.g. Integration by parts" />
      <Field label="Description (context for question generation)" value={description}
        onChangeText={setDescription} multiline />
      <Text style={s.editorLabel}>Question type</Text>
      <Choice options={QUESTION_TYPES} value={qtype} onChange={setQtype} />
      <Text style={s.editorLabel}>Effort</Text>
      <Choice
        options={[{ value: 'quick', label: 'quick (phone)' }, { value: 'deep', label: 'deep (desk)' }]}
        value={effort} onChange={setEffort}
      />
      <Btn label={skill ? 'Save changes' : 'Add skill'} onPress={save} busy={busy} />
    </Sheet>
  );
}

function NoteEditor({ visible, editor, userId, onClose, onSaved }) {
  const note = editor?.note;
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  React.useEffect(() => { setBody(note?.body || ''); setErr(''); }, [editor]);

  const save = async () => {
    setBusy(true); setErr('');
    try {
      if (note) {
        if (body.trim()) await api.updateNote(note.id, userId, body.trim());
        else await api.deleteNote(note.id, userId); // empty body = remove the note
      } else if (body.trim()) {
        await api.createNote({ user_id: userId, unit_id: editor.unitId, body: body.trim() });
      }
      onSaved();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title="My note (private)" onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Field value={body} onChangeText={setBody} multiline
        placeholder="Only you see this. Clear the text to delete the note." />
      <Btn label="Save note" onPress={save} busy={busy} />
    </Sheet>
  );
}

function ExamDateEditor({ visible, enrollment, onClose, onSaved }) {
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  React.useEffect(() => {
    setDate(enrollment?.exam_date ? enrollment.exam_date.slice(0, 10) : '');
    setErr('');
  }, [enrollment, visible]);

  const save = async () => {
    setBusy(true); setErr('');
    try {
      if (!date.trim()) {
        await api.updateEnrollment(enrollment.id, { clear_exam_date: true });
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
        await api.updateEnrollment(enrollment.id, { exam_date: `${date.trim()}T09:00:00` });
      } else {
        setErr('Use the format YYYY-MM-DD, e.g. 2026-08-20.'); setBusy(false); return;
      }
      onSaved();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title="Exam date" onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Text style={s.editorHint}>
        The closer the exam, the more often the agent nudges you. Leave empty to clear.
      </Text>
      <Field value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
      <Btn label="Save" onPress={save} busy={busy} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tagRow: { flexDirection: 'row', marginBottom: 6 },
  desc: { color: colors.ink, lineHeight: 20, marginBottom: 8 },
  enrollInfo: { color: colors.inkSoft, marginVertical: 6 },
  btnRow: { flexDirection: 'row', gap: 8 },
  btnHalf: { flex: 1 },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18,
  },
  section: {
    fontSize: 14, fontWeight: '700', color: colors.inkSoft,
    marginTop: 18, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  addLink: { color: colors.shared, fontWeight: '600' },
  unitCard: { paddingVertical: 10 },
  unitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, flexShrink: 1 },
  unitContent: { color: colors.inkSoft, marginTop: 6, lineHeight: 19 },
  noteText: { color: colors.personal, marginTop: 6, lineHeight: 19 },
  unitActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  actionLink: { marginRight: 14, paddingVertical: 2 },
  actionText: { color: colors.shared, fontSize: 13, fontWeight: '600' },
  skillCard: { paddingVertical: 8, marginVertical: 3 },
  skillName: { fontSize: 15, color: colors.ink, flexShrink: 1, marginRight: 8 },
  editorLabel: { fontSize: 13, fontWeight: '600', color: colors.inkSoft, marginBottom: 4 },
  editorHint: { color: colors.inkSoft, marginBottom: 10, lineHeight: 19 },
});
