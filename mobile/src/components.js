// Small shared UI vocabulary used by every screen.
import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors, radius, pad } from './theme';

export function Btn({ label, onPress, busy, kind = 'primary', small }) {
  const style = [
    s.btn,
    kind === 'secondary' && s.btnSecondary,
    kind === 'danger' && s.btnDanger,
    small && s.btnSmall,
  ];
  const textStyle = [
    s.btnText,
    kind === 'secondary' && s.btnTextSecondary,
    small && s.btnTextSmall,
  ];
  return (
    <TouchableOpacity style={style} onPress={onPress} disabled={busy}>
      {busy ? <ActivityIndicator color={kind === 'secondary' ? colors.ink : '#fff'} />
            : <Text style={textStyle}>{label}</Text>}
    </TouchableOpacity>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize }) {
  return (
    <View style={{ marginBottom: 10 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        style={[s.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor="#aaa" multiline={!!multiline}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize ?? 'sentences'}
      />
    </View>
  );
}

export function Tag({ text, color }) {
  return (
    <View style={[s.tag, { backgroundColor: (color || colors.inkSoft) + '22' }]}>
      <Text style={[s.tagText, { color: color || colors.inkSoft }]}>{text}</Text>
    </View>
  );
}

export function Bar({ value }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const barColor = pct >= 70 ? colors.good : pct >= 40 ? colors.warn : colors.bad;
  return (
    <View style={s.barBg}>
      <View style={[s.bar, { width: `${pct}%`, backgroundColor: barColor }]} />
    </View>
  );
}

export function ErrorText({ children }) {
  return children ? <Text style={s.err}>{String(children)}</Text> : null;
}

export function EmptyText({ children }) {
  return <Text style={s.empty}>{children}</Text>;
}

export function Choice({ options, value, onChange }) {
  // A compact segmented control: options = [{value, label}]
  return (
    <View style={s.choiceRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[s.choice, value === o.value && s.choiceOn]}
          onPress={() => onChange(o.value)}
        >
          <Text style={value === o.value ? s.choiceTextOn : s.choiceText}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Sheet({ visible, title, onClose, children }) {
  // Bottom-sheet style modal used by all editors.
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={s.sheetClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.accent, borderRadius: radius, padding: 14,
    alignItems: 'center', marginVertical: 6,
  },
  btnSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  btnDanger: { backgroundColor: colors.bad },
  btnSmall: { padding: 8, marginVertical: 3 },
  btnText: { color: colors.accentText, fontWeight: '600', fontSize: 16 },
  btnTextSecondary: { color: colors.ink },
  btnTextSmall: { fontSize: 13 },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 14, marginVertical: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkSoft, marginBottom: 4 },
  input: {
    backgroundColor: colors.card, borderRadius: radius, padding: 12, fontSize: 16,
    borderWidth: 1, borderColor: colors.line, color: colors.ink,
  },
  tag: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
    marginRight: 6, alignSelf: 'flex-start',
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  barBg: { height: 8, backgroundColor: colors.line, borderRadius: 4, marginVertical: 4 },
  bar: { height: 8, borderRadius: 4 },
  err: { color: colors.bad, marginVertical: 8 },
  empty: { color: colors.inkSoft, marginVertical: 12, textAlign: 'center' },
  choiceRow: { flexDirection: 'row', marginBottom: 10 },
  choice: {
    flex: 1, padding: 10, alignItems: 'center', borderWidth: 1,
    borderColor: colors.line, backgroundColor: colors.card,
  },
  choiceOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.ink },
  choiceTextOn: { color: colors.accentText, fontWeight: '600' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0006' },
  sheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: pad, maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  sheetClose: { fontSize: 18, color: colors.inkSoft, padding: 4 },
});
