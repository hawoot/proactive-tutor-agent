// The shared UI kit: chunky playful buttons, soft cards, chips, bars,
// bottom sheets. Every screen builds from these so the app feels coherent.
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Animated, Image,
} from 'react-native';
import { colors, radius, pad, type, shadow } from './theme';
import { MASCOT } from './brand';

// Phil himself. A slow idle bob - alive, never distracting.
export function Mascot({ pose = 'wave', size = 96, bob = true, style }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!bob) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -4, duration: 1600, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 1600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bob, y]);
  return (
    <Animated.View style={[{ transform: [{ translateY: y }] }, style]}>
      <Image source={MASCOT[pose] || MASCOT.wave} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}

const BTN_COLORS = {
  primary: [colors.primary, colors.primaryDark],
  blue: [colors.blue, colors.blueDark],
  purple: [colors.purple, colors.purpleDark],
  danger: [colors.red, colors.redDark],
  orange: [colors.orange, colors.orangeDark],
};

export function Btn({ label, onPress, busy, color = 'primary', kind = 'solid', small }) {
  const [bg, edge] = BTN_COLORS[color] || BTN_COLORS.primary;
  if (kind === 'ghost') {
    return (
      <TouchableOpacity onPress={onPress} disabled={busy} style={s.ghostBtn}>
        <Text style={[s.ghostText, small && { fontSize: 14 }]}>{label}</Text>
      </TouchableOpacity>
    );
  }
  const outline = kind === 'outline';
  return (
    <TouchableOpacity
      onPress={onPress} disabled={busy} activeOpacity={0.8}
      style={[
        s.btn, small && s.btnSmall,
        outline
          ? { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, borderBottomWidth: 4, ...shadow.sm }
          : { backgroundColor: bg, borderBottomWidth: 4, borderBottomColor: edge, ...shadow.sm },
      ]}
    >
      {busy ? <ActivityIndicator color={outline ? colors.ink : '#fff'} /> : (
        <Text style={[s.btnText, small && { fontSize: 14 }, outline && { color: colors.ink }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function Card({ children, style, tint }) {
  return (
    <View style={[s.card, tint && { borderColor: tint, borderWidth: 1.5 }, style]}>
      {children}
    </View>
  );
}

export function Chip({ text, color }) {
  const c = color || colors.inkSoft;
  return (
    <View style={[s.chip, { backgroundColor: c + '1A' }]}>
      <Text style={[s.chipText, { color: c }]}>{text}</Text>
    </View>
  );
}

export function Bar({ value, color, height = 12 }) {
  const pct = Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
  const fill = color || (pct >= 70 ? colors.good : pct >= 40 ? colors.warn : colors.bad);
  return (
    <View style={[s.barBg, { height, borderRadius: height / 2 }]}>
      <View style={[s.bar, { width: `${pct}%`, backgroundColor: fill, borderRadius: height / 2 }]} />
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize, hint }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        style={[s.input, multiline && { minHeight: 90, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.inkFaint} multiline={!!multiline}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize ?? 'sentences'}
      />
      {hint ? <Text style={s.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <View style={s.sectionRow}>
      <Text style={type.label}>{children}</Text>
      {right || null}
    </View>
  );
}

export function EmptyState({ emoji, pose, title, hint }) {
  return (
    <View style={s.empty}>
      {pose ? <Mascot pose={pose} size={110} /> : <Text style={{ fontSize: 44 }}>{emoji}</Text>}
      <Text style={[type.title, { marginTop: 8, textAlign: 'center' }]}>{title}</Text>
      {hint ? <Text style={[type.meta, { marginTop: 4, textAlign: 'center' }]}>{hint}</Text> : null}
    </View>
  );
}

export function ErrorText({ children }) {
  return children ? <Text style={s.err}>{String(children)}</Text> : null;
}

export function Choice({ options, value, onChange }) {
  // options: [{value, label, hint?}] - stacked selectable rows with hints.
  return (
    <View style={{ marginBottom: 6 }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <TouchableOpacity
            key={o.value} onPress={() => onChange(o.value)} activeOpacity={0.8}
            style={[s.choice, on && s.choiceOn]}
          >
            <View style={[s.radio, on && s.radioOn]}>{on ? <View style={s.radioDot} /> : null}</View>
            <View style={{ flex: 1 }}>
              <Text style={[s.choiceLabel, on && { color: colors.blueDark }]}>{o.label}</Text>
              {o.hint ? <Text style={s.choiceHint}>{o.hint}</Text> : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Sheet({ visible, title, onClose, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={type.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={s.sheetClose}>
              <Text style={{ fontSize: 16, color: colors.inkSoft }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 18,
    alignItems: 'center', marginVertical: 6,
  },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 14, marginVertical: 4 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.4 },
  ghostBtn: { alignItems: 'center', paddingVertical: 10 },
  ghostText: { color: colors.blue, fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: pad,
    marginVertical: 7, ...shadow.sm,
  },
  chip: {
    borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3,
    marginRight: 6, marginBottom: 4, alignSelf: 'flex-start',
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  barBg: { backgroundColor: colors.line, overflow: 'hidden', flex: 1 },
  bar: { height: '100%' },
  fieldLabel: { ...type.label, marginBottom: 6 },
  fieldHint: { fontSize: 12, color: colors.inkFaint, marginTop: 4 },
  input: {
    backgroundColor: colors.bgSoft, borderRadius: radius.md, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: colors.line, color: colors.ink,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, marginBottom: 8,
  },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  err: {
    color: colors.bad, backgroundColor: colors.bad + '14', padding: 10,
    borderRadius: radius.sm, marginVertical: 8, overflow: 'hidden',
  },
  choice: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8,
    borderWidth: 2, borderColor: colors.line, borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  choiceOn: { borderColor: colors.blue, backgroundColor: colors.blue + '0D' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.line, marginRight: 10, alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: colors.blue },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.blue },
  choiceLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  choiceHint: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' },
  sheet: {
    backgroundColor: colors.bgSoft, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: pad, maxHeight: '90%',
  },
  sheetHandle: {
    width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line,
    alignSelf: 'center', marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  sheetClose: { padding: 6 },
});
