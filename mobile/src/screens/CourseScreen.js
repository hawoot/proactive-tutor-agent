// One course. Read mode: clean accordion of topics, mastery bars, one
// enroll button, tutor settings in a sheet. Edit mode (pencil toggle):
// curator tools - units, skills, and the question bank manager.
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getConfig } from '../api';
import {
  Btn, Card, Chip, Bar, Field, Sheet, Choice, ErrorText, EmptyState, SectionTitle,
} from '../components';
import { colors, pad, type } from '../theme';
import { POLICY_LABELS, EFFORT_LABELS } from '../labels';

export default function CourseScreen({ route, navigation }) {
  const programId = route.params.id;
  const [userId, setUserId] = useState(1);
  const [program, setProgram] = useState(null);
  const [tree, setTree] = useState([]);
  const [looseSkills, setLooseSkills] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [mastery, setMastery] = useState({});     // skill_id -> {score, attempts}
  const [notes, setNotes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sheet, setSheet] = useState(null); // {type: settings|unit|skill|note|bank, ...}

  const load = useCallback(async () => {
    setErr('');
    try {
      const { userId: uid } = await getConfig();
      setUserId(uid);
      const [programs, treeData, skills, enrollments, noteList, prog] = await Promise.all([
        api.listPrograms(uid), api.programTree(programId), api.programSkills(programId),
        api.listEnrollments(uid), api.listNotes(uid), api.progress(uid),
      ]);
      const p = programs.find((x) => x.id === programId);
      if (!p) { setErr('Course not found - was it deleted?'); return; }
      setProgram(p);
      setTree(treeData);
      const inUnits = new Set();
      const collect = (ns) => ns.forEach((n) => { n.skills.forEach((sk) => inUnits.add(sk.id)); collect(n.children); });
      collect(treeData);
      setLooseSkills(skills.filter((sk) => !inUnits.has(sk.id)));
      setEnrollment(enrollments.find((e) => e.program_id === programId) || null);
      setNotes(noteList);
      const enrProgress = prog.enrollments.find((e) => e.program_id === programId);
      const m = {};
      (enrProgress?.skills || []).forEach((sk) => { m[sk.skill_id] = sk; });
      setMastery(m);
    } catch (e) { setErr(e.message); }
  }, [programId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const canEdit = program && (program.owner_id === null || program.owner_id === userId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => canEdit ? (
        <TouchableOpacity onPress={() => setEditMode((v) => !v)} style={{ padding: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: editMode ? colors.blueDark : colors.inkSoft }}>
            {editMode ? '✓ Done' : '✏️ Edit'}
          </Text>
        </TouchableOpacity>
      ) : null,
    });
  }, [navigation, canEdit, editMode]);

  const act = async (fn) => {
    setErr('');
    try { await fn(); await load(); } catch (e) { setErr(e.message); }
  };

  const confirmDelete = (what, fn) => Alert.alert(`Delete ${what}?`, 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: fn },
  ]);

  if (!program) {
    return (
      <ScrollView style={s.root} contentContainerStyle={{ padding: pad }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <ErrorText>{err}</ErrorText>
        {!err && <EmptyState emoji="⏳" title="Loading course…" />}
      </ScrollView>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ padding: pad, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <ErrorText>{err}</ErrorText>

        {/* header */}
        <Card tint={enrollment ? colors.primary : undefined}>
          <View style={s.chipRow}>
            <Chip text={program.owner_id === null ? 'library' : 'my course'}
              color={program.owner_id === null ? colors.shared : colors.personal} />
            {program.level ? <Chip text={program.level} /> : null}
          </View>
          {program.description ? <Text style={[type.body, { marginTop: 4 }]}>{program.description}</Text> : null}

          {enrollment ? (
            <View style={{ marginTop: 10 }}>
              <Text style={s.enrolledLine}>
                {enrollment.status === 'active' ? "✅ You're enrolled" : '⏸️ Paused'}
                {enrollment.exam_date ? ` · 🎯 exam ${enrollment.exam_date.slice(0, 10)}` : ''}
              </Text>
              <Btn small kind="outline" label="⚙️ Tutor settings"
                onPress={() => setSheet({ type: 'settings' })} />
            </View>
          ) : (
            <Btn label="Enroll - let the tutor chase you"
              onPress={() => act(() => api.enroll(userId, programId))} />
          )}
        </Card>

        {/* edit-mode banner + program-level tools */}
        {editMode && (
          <Card tint={colors.blue} style={{ backgroundColor: colors.blue + '0D' }}>
            <Text style={s.editBanner}>✏️ Edit mode - curator tools are visible</Text>
            <View style={s.rowWrap}>
              <Btn small kind="outline" label="+ Topic" onPress={() => setSheet({ type: 'unit', parentId: null })} />
              <Btn small kind="outline" label="+ Skill (no topic)" onPress={() => setSheet({ type: 'skill', unitId: null })} />
              <Btn small kind="outline" label="Clone course" onPress={() => act(async () => {
                const copy = await api.cloneProgram(programId, userId);
                navigation.replace('Course', { id: copy.id, title: copy.title });
              })} />
              <Btn small color="danger" label="Delete course" onPress={() =>
                confirmDelete('course', () => act(async () => {
                  await api.deleteProgram(programId, userId);
                  navigation.goBack();
                }))} />
            </View>
          </Card>
        )}

        {/* the tree */}
        <SectionTitle>Topics</SectionTitle>
        {tree.length === 0 && looseSkills.length === 0 ? (
          <EmptyState emoji="🌱" title="Empty course"
            hint={canEdit ? 'Flip to Edit and add the first topic.' : 'Nothing here yet.'} />
        ) : null}
        {tree.map((node) => (
          <UnitAccordion key={node.id} node={node} depth={0} editMode={editMode}
            mastery={mastery} notes={notes} enrolled={!!enrollment}
            onAction={(action, payload) => {
              if (action === 'note') setSheet({ type: 'note', unitId: payload.unit.id, note: payload.note });
              else if (action === 'editUnit') setSheet({ type: 'unit', unit: payload });
              else if (action === 'addChild') setSheet({ type: 'unit', parentId: payload.id });
              else if (action === 'addSkill') setSheet({ type: 'skill', unitId: payload.id });
              else if (action === 'editSkill') setSheet({ type: 'skill', skill: payload });
              else if (action === 'bank') setSheet({ type: 'bank', skill: payload });
              else if (action === 'deleteUnit') confirmDelete('topic (and everything inside)', () => act(() => api.deleteUnit(payload.id, userId)));
              else if (action === 'deleteSkill') confirmDelete('skill', () => act(() => api.deleteSkill(payload.id, userId)));
            }}
          />
        ))}
        {looseSkills.map((sk) => (
          <SkillRow key={sk.id} skill={sk} editMode={editMode} mastery={mastery[sk.id]}
            onEdit={() => setSheet({ type: 'skill', skill: sk })}
            onBank={() => setSheet({ type: 'bank', skill: sk })}
            onDelete={() => confirmDelete('skill', () => act(() => api.deleteSkill(sk.id, userId)))} />
        ))}
      </ScrollView>

      <TutorSettingsSheet
        visible={sheet?.type === 'settings'} enrollment={enrollment} userId={userId}
        onClose={() => setSheet(null)} onChanged={() => { setSheet(null); load(); }}
      />
      <UnitEditor
        visible={sheet?.type === 'unit'} sheet={sheet} programId={programId} userId={userId}
        onClose={() => setSheet(null)} onSaved={() => { setSheet(null); load(); }}
      />
      <SkillEditor
        visible={sheet?.type === 'skill'} sheet={sheet} programId={programId} userId={userId}
        onClose={() => setSheet(null)} onSaved={() => { setSheet(null); load(); }}
      />
      <NoteEditor
        visible={sheet?.type === 'note'} sheet={sheet} userId={userId}
        onClose={() => setSheet(null)} onSaved={() => { setSheet(null); load(); }}
      />
      <QuestionBank
        visible={sheet?.type === 'bank'} skill={sheet?.skill} userId={userId}
        onClose={() => { setSheet(null); load(); }}
      />
    </View>
  );
}

// --- tree pieces ------------------------------------------------------------

function UnitAccordion({ node, depth, editMode, mastery, notes, enrolled, onAction }) {
  const [open, setOpen] = useState(depth === 0);
  const myNote = notes.find((n) => n.unit_id === node.id);
  const skillCount = countSkills(node);
  return (
    <View style={{ marginLeft: depth * 12 }}>
      <Card style={{ paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => setOpen(!open)} activeOpacity={0.7}>
          <View style={s.unitHead}>
            <Text style={s.unitTitle}>{node.title}</Text>
            <Text style={s.unitMeta}>{skillCount > 0 ? `${skillCount} · ` : ''}{open ? '▾' : '▸'}</Text>
          </View>
        </TouchableOpacity>
        {open && node.content ? <Text style={s.unitContent}>{node.content}</Text> : null}
        {open && myNote ? <Text style={s.noteText}>📝 {myNote.body}</Text> : null}
        {open && (
          <View style={s.linkRow}>
            <LinkBtn label={myNote ? 'edit my note' : '+ my note'}
              onPress={() => onAction('note', { unit: node, note: myNote })} />
            {editMode && <LinkBtn label="edit" onPress={() => onAction('editUnit', node)} />}
            {editMode && <LinkBtn label="+ sub-topic" onPress={() => onAction('addChild', node)} />}
            {editMode && <LinkBtn label="+ skill" onPress={() => onAction('addSkill', node)} />}
            {editMode && <LinkBtn label="delete" danger onPress={() => onAction('deleteUnit', node)} />}
          </View>
        )}
      </Card>
      {open && node.skills.map((sk) => (
        <View key={sk.id} style={{ marginLeft: 12 }}>
          <SkillRow skill={sk} editMode={editMode} mastery={mastery[sk.id]}
            onEdit={() => onAction('editSkill', sk)}
            onBank={() => onAction('bank', sk)}
            onDelete={() => onAction('deleteSkill', sk)} />
        </View>
      ))}
      {open && node.children.map((child) => (
        <UnitAccordion key={child.id} node={child} depth={depth + 1} editMode={editMode}
          mastery={mastery} notes={notes} enrolled={enrolled} onAction={onAction} />
      ))}
    </View>
  );
}

function countSkills(node) {
  return node.skills.length + node.children.reduce((acc, c) => acc + countSkills(c), 0);
}

function SkillRow({ skill, editMode, mastery, onEdit, onBank, onDelete }) {
  return (
    <Card style={{ paddingVertical: 10, marginVertical: 3 }}>
      <View style={s.unitHead}>
        <Text style={s.skillName} numberOfLines={2}>{skill.name}</Text>
        <Text style={s.unitMeta}>{EFFORT_LABELS[skill.effort] || skill.effort}</Text>
      </View>
      {mastery ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Bar value={mastery.score} height={8} />
          <Text style={s.masteryPct}>{Math.round(mastery.score * 100)}%</Text>
        </View>
      ) : null}
      {editMode && (
        <View style={s.linkRow}>
          <LinkBtn label="edit" onPress={onEdit} />
          <LinkBtn label={`questions (${skill.question_count || 0})`} onPress={onBank} />
          <LinkBtn label="delete" danger onPress={onDelete} />
        </View>
      )}
    </Card>
  );
}

function LinkBtn({ label, onPress, danger }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginRight: 16, paddingVertical: 3 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: danger ? colors.bad : colors.blue }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// --- sheets --------------------------------------------------------------------

function TutorSettingsSheet({ visible, enrollment, userId, onClose, onChanged }) {
  const [values, setValues] = useState({});
  const [examDate, setExamDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  React.useEffect(() => {
    if (!visible || !enrollment) return;
    setErr('');
    setValues({
      question_source: enrollment.question_source,
      selection_strategy: enrollment.selection_strategy,
      marking_strictness: enrollment.marking_strictness,
      question_style: enrollment.question_style,
    });
    setExamDate(enrollment.exam_date ? enrollment.exam_date.slice(0, 10) : '');
  }, [visible, enrollment]);

  if (!enrollment) return null;

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const patch = { ...values };
      if (!examDate.trim()) patch.clear_exam_date = true;
      else if (/^\d{4}-\d{2}-\d{2}$/.test(examDate.trim())) patch.exam_date = `${examDate.trim()}T09:00:00`;
      else { setErr('Exam date must look like 2026-08-20 (or be empty).'); setBusy(false); return; }
      await api.updateEnrollment(enrollment.id, patch);
      onChanged();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const group = (key) => {
    const meta = POLICY_LABELS[key];
    return (
      <View key={key} style={{ marginBottom: 8 }}>
        <Text style={[type.label, { marginBottom: 6 }]}>{meta.title}</Text>
        <Choice
          value={values[key]}
          onChange={(v) => setValues((p) => ({ ...p, [key]: v }))}
          options={Object.entries(meta.options).map(([value, o]) => ({ value, ...o }))}
        />
      </View>
    );
  };

  return (
    <Sheet visible={visible} title="Tutor settings" onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Field label="🎯 Exam date" value={examDate} onChangeText={setExamDate}
        placeholder="YYYY-MM-DD (empty = none)" autoCapitalize="none"
        hint="The closer the exam, the more often your tutor nudges you." />
      {group('question_source')}
      {group('selection_strategy')}
      {group('marking_strictness')}
      <Btn label="Save settings" onPress={save} busy={busy} />
      <View style={s.dangerRow}>
        <Btn small kind="outline"
          label={enrollment.status === 'active' ? '⏸️ Pause course' : '▶️ Resume course'}
          onPress={async () => {
            try {
              await api.updateEnrollment(enrollment.id, {
                status: enrollment.status === 'active' ? 'paused' : 'active',
              });
              onChanged();
            } catch (e) { setErr(e.message); }
          }} />
        <Btn small color="danger" label="Unenroll"
          onPress={() => Alert.alert('Unenroll?', 'Your mastery history for this course is removed.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Unenroll', style: 'destructive',
              onPress: async () => {
                try { await api.unenroll(enrollment.id); onChanged(); }
                catch (e) { setErr(e.message); }
              },
            },
          ])} />
      </View>
    </Sheet>
  );
}

function UnitEditor({ visible, sheet, programId, userId, onClose, onSaved }) {
  const unit = sheet?.unit;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  React.useEffect(() => {
    setTitle(unit?.title || ''); setContent(unit?.content || ''); setErr('');
  }, [sheet]);

  const save = async () => {
    if (!title.trim()) { setErr('Title is required.'); return; }
    setBusy(true); setErr('');
    try {
      if (unit) await api.updateUnit(unit.id, userId, { title: title.trim(), content });
      else await api.createUnit(userId, {
        program_id: programId, parent_id: sheet?.parentId ?? null, title: title.trim(), content,
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title={unit ? 'Edit topic' : 'New topic'} onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Calculus" />
      <Field label="Material" value={content} onChangeText={setContent} multiline
        placeholder="Notes the tutor can set questions from…" />
      <Btn label={unit ? 'Save' : 'Add topic'} onPress={save} busy={busy} />
    </Sheet>
  );
}

const QUESTION_TYPES = ['numeric', 'symbolic', 'mcq', 'code', 'rubric'];

function SkillEditor({ visible, sheet, programId, userId, onClose, onSaved }) {
  const skill = sheet?.skill;
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
  }, [sheet]);

  const save = async () => {
    if (!name.trim()) { setErr('Name is required.'); return; }
    setBusy(true); setErr('');
    try {
      const payload = { name: name.trim(), description, question_type: qtype, effort };
      if (skill) await api.updateSkill(skill.id, userId, payload);
      else await api.createSkill(userId, { ...payload, program_id: programId, unit_id: sheet?.unitId ?? null });
      onSaved();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title={skill ? 'Edit skill' : 'New skill'} onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Integration by parts" />
      <Field label="Context for the question writer" value={description} onChangeText={setDescription} multiline />
      <Text style={[type.label, { marginBottom: 6 }]}>Question type</Text>
      <Choice value={qtype} onChange={setQtype}
        options={QUESTION_TYPES.map((v) => ({ value: v, label: v }))} />
      <Text style={[type.label, { marginBottom: 6 }]}>Effort</Text>
      <Choice value={effort} onChange={setEffort} options={[
        { value: 'quick', label: '⚡ Quick', hint: 'Answerable on a phone in a minute or two.' },
        { value: 'deep', label: '🧠 Deep', hint: 'Pen-and-paper, proper working.' },
      ]} />
      <Btn label={skill ? 'Save' : 'Add skill'} onPress={save} busy={busy} />
    </Sheet>
  );
}

function NoteEditor({ visible, sheet, userId, onClose, onSaved }) {
  const note = sheet?.note;
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  React.useEffect(() => { setBody(note?.body || ''); setErr(''); }, [sheet]);

  const save = async () => {
    setBusy(true); setErr('');
    try {
      if (note) {
        if (body.trim()) await api.updateNote(note.id, userId, body.trim());
        else await api.deleteNote(note.id, userId);
      } else if (body.trim()) {
        await api.createNote({ user_id: userId, unit_id: sheet.unitId, body: body.trim() });
      }
      onSaved();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title="My note (only you see it)" onClose={onClose}>
      <ErrorText>{err}</ErrorText>
      <Field value={body} onChangeText={setBody} multiline
        placeholder="Anything you want to remember about this topic. Clear the text to delete." />
      <Btn label="Save note" onPress={save} busy={busy} />
    </Sheet>
  );
}

function QuestionBank({ visible, skill, userId, onClose }) {
  const [questions, setQuestions] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | question object
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [commentary, setCommentary] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!skill) return;
    try { setQuestions(await api.listQuestions(skill.id)); }
    catch (e) { setErr(e.message); }
  }, [skill]);

  React.useEffect(() => {
    if (visible) { setQuestions(null); setEditing(null); setErr(''); load(); }
  }, [visible, load]);

  const startEdit = (q) => {
    setEditing(q || 'new');
    setText(q?.text || ''); setAnswer(q?.answer || ''); setCommentary(q?.commentary || '');
  };

  const save = async () => {
    if (!text.trim()) { setErr('Question text is required.'); return; }
    setBusy(true); setErr('');
    try {
      const payload = { text: text.trim(), answer, commentary };
      if (editing === 'new') {
        await api.createQuestion(userId, {
          ...payload, skill_id: skill.id, position: (questions || []).length,
        });
      } else {
        await api.updateQuestion(editing.id, userId, payload);
      }
      setEditing(null);
      await load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const remove = (q) => Alert.alert('Delete question?', '', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete', style: 'destructive',
      onPress: async () => {
        try { await api.deleteQuestion(q.id, userId); await load(); }
        catch (e) { setErr(e.message); }
      },
    },
  ]);

  return (
    <Sheet visible={visible} title={`Question bank · ${skill?.name || ''}`} onClose={onClose}>
      <ErrorText>{err}</ErrorText>

      {editing ? (
        <>
          <Field label="Question" value={text} onChangeText={setText} multiline />
          <Field label="Model answer (the marker trusts this)" value={answer} onChangeText={setAnswer} multiline />
          <Field label="Marking guidance" value={commentary} onChangeText={setCommentary} multiline
            hint="What earns partial credit, common slips…" />
          <Btn label="Save question" onPress={save} busy={busy} />
          <Btn label="Cancel" kind="ghost" onPress={() => setEditing(null)} />
        </>
      ) : (
        <>
          {questions === null ? <Text style={type.meta}>Loading…</Text> : null}
          {questions !== null && questions.length === 0 ? (
            <Text style={[type.meta, { marginBottom: 8 }]}>
              No curated questions yet - the tutor improvises for this skill.
            </Text>
          ) : null}
          {(questions || []).map((q, i) => (
            <Card key={q.id} style={{ paddingVertical: 10 }}>
              <Text style={type.meta}>#{i + 1} · {q.source}</Text>
              <Text style={[type.body, { marginTop: 4 }]} numberOfLines={3}>{q.text}</Text>
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <LinkBtn label="edit" onPress={() => startEdit(q)} />
                <LinkBtn label="delete" danger onPress={() => remove(q)} />
              </View>
            </Card>
          ))}
          <Btn label="+ Add question" kind="outline" onPress={() => startEdit(null)} />
        </>
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  enrolledLine: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  editBanner: { fontWeight: '800', color: colors.blueDark, marginBottom: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, flexShrink: 1, marginRight: 8 },
  unitMeta: { fontSize: 13, color: colors.inkFaint, fontWeight: '700' },
  unitContent: { ...type.meta, marginTop: 8, lineHeight: 19 },
  noteText: { color: colors.purpleDark, marginTop: 8, lineHeight: 19, fontSize: 13.5 },
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  skillName: { fontSize: 15, fontWeight: '600', color: colors.ink, flexShrink: 1, marginRight: 8 },
  masteryPct: { marginLeft: 8, fontSize: 12, fontWeight: '800', color: colors.inkSoft, width: 38, textAlign: 'right' },
  dangerRow: { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'space-between' },
});
