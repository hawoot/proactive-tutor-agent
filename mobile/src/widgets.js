// Visual controls for Settings:
//   NudgeTimes  - pick the exact clock times you want to be nudged, on the
//                 days you choose. Times and the day toggles are two views of
//                 the same data; edit either and the other reflects it.
//   GoalSlider  - a real draggable slider for the daily goal.
//   TimezonePicker - pick-from-list sheet.
// Rule of the house: fewer forms, more tapping.
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Slider from '@react-native-community/slider';
import { Sheet, Btn } from './components';
import { colors, radius, type } from './theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// --- time helpers ------------------------------------------------------------

function pad2(n) { return String(n).padStart(2, '0'); }

// 24h internally, friendly 12h on screen ("5:00 PM").
function fmtTime(hour, minute) {
  const h12 = hour % 12 || 12;
  return `${h12}:${pad2(minute)} ${hour < 12 ? 'AM' : 'PM'}`;
}

// rows  <->  {days, clocks}.  rows = days x clocks (cross product), so a single
// flat list of {weekday,hour,minute} fully captures "these times, these days".
function rowsToModel(rows) {
  const days = [...new Set((rows || []).map((r) => r.weekday))].sort((a, b) => a - b);
  const seen = new Set();
  const clocks = [];
  for (const r of rows || []) {
    const key = r.hour * 60 + r.minute;
    if (!seen.has(key)) { seen.add(key); clocks.push({ hour: r.hour, minute: r.minute }); }
  }
  clocks.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
  // No rows yet -> show all days selected as a sensible starting point.
  return { days: days.length ? days : ALL_DAYS, clocks };
}

function modelToRows(days, clocks) {
  const rows = [];
  for (const d of days) for (const c of clocks) rows.push({ weekday: d, hour: c.hour, minute: c.minute });
  return rows;
}

// --- NudgeTimes --------------------------------------------------------------

export function NudgeTimes({ times, onChange }) {
  const { days, clocks } = useMemo(() => rowsToModel(times), [times]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggleDay = (d) => {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => a - b);
    if (next.length === 0) return;  // keep at least one day; clear times to turn off
    onChange(modelToRows(next, clocks));
  };

  const addClock = (hour, minute) => {
    if (clocks.some((c) => c.hour === hour && c.minute === minute)) return;
    onChange(modelToRows(days, [...clocks, { hour, minute }]));
  };

  const removeClock = (c) =>
    onChange(modelToRows(days, clocks.filter((x) => !(x.hour === c.hour && x.minute === c.minute))));

  return (
    <View>
      <Text style={s.subLabel}>On these days</Text>
      <View style={s.dayRow}>
        {DAYS.map((label, d) => {
          const on = days.includes(d);
          return (
            <TouchableOpacity key={label} onPress={() => toggleDay(d)}
              style={[s.dayChip, on && s.dayChipOn]}>
              <Text style={[s.dayChipText, on && s.dayChipTextOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[s.subLabel, { marginTop: 14 }]}>At these times</Text>
      {clocks.length === 0 ? (
        <Text style={[s.hint, { color: colors.orangeDark }]}>
          No times yet - add at least one, or you won't be nudged.
        </Text>
      ) : null}
      <View style={s.timeWrap}>
        {clocks.map((c) => (
          <View key={`${c.hour}:${c.minute}`} style={s.timeChip}>
            <Text style={s.timeChipText}>{fmtTime(c.hour, c.minute)}</Text>
            <TouchableOpacity onPress={() => removeClock(c)} hitSlop={8} style={{ marginLeft: 6 }}>
              <Text style={s.timeChipX}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addChip} onPress={() => setPickerOpen(true)}>
          <Text style={s.addChipText}>+ Add time</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.hint}>Labib pings you at each time, on each chosen day.</Text>

      <TimePickerSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addClock} />
    </View>
  );
}

const HOURS = [...Array(24)].map((_, h) => h);
const MINUTES = [0, 15, 30, 45];

function TimePickerSheet({ visible, onClose, onPick }) {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  return (
    <Sheet visible={visible} title="Add a time" onClose={onClose}>
      <Text style={s.subLabel}>Hour</Text>
      <View style={s.hourGrid}>
        {HOURS.map((h) => {
          const on = h === hour;
          return (
            <TouchableOpacity key={h} onPress={() => setHour(h)}
              style={[s.hourCell, on && s.hourCellOn]}>
              <Text style={[s.hourText, on && s.hourTextOn]}>{h % 12 || 12}{h < 12 ? 'a' : 'p'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[s.subLabel, { marginTop: 12 }]}>Minute</Text>
      <View style={s.minRow}>
        {MINUTES.map((m) => {
          const on = m === minute;
          return (
            <TouchableOpacity key={m} onPress={() => setMinute(m)}
              style={[s.minCell, on && s.minCellOn]}>
              <Text style={[s.minText, on && s.minTextOn]}>:{pad2(m)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ marginTop: 16 }}>
        <Btn label={`Add ${fmtTime(hour, minute)}`} onPress={() => { onPick(hour, minute); onClose(); }} />
      </View>
    </Sheet>
  );
}

// --- GoalSlider (real draggable slider) --------------------------------------

export function GoalSlider({ value, onChange, max = 10 }) {
  const v = Math.max(1, Math.min(max, parseInt(value, 10) || 1));
  return (
    <View>
      <View style={s.goalHead}>
        <Text style={s.goalValue}>{v}</Text>
        <Text style={s.goalUnit}>question{v > 1 ? 's' : ''} / day</Text>
      </View>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={1} maximumValue={max} step={1} value={v}
        onValueChange={(n) => onChange(Math.round(n))}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.line}
        thumbTintColor={colors.primaryDark}
      />
      <View style={s.goalScale}>
        <Text style={s.goalScaleTxt}>1</Text>
        <Text style={s.goalScaleTxt}>{max}</Text>
      </View>
    </View>
  );
}

// --- TimezonePicker ----------------------------------------------------------

const COMMON_TIMEZONES = [
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Istanbul', 'Europe/Moscow', 'Africa/Tunis', 'Africa/Cairo', 'Africa/Casablanca',
  'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Riyadh',
  'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Singapore',
  'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney',
  'Australia/Perth', 'Pacific/Auckland', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Mexico_City',
  'America/Sao_Paulo', 'America/Buenos_Aires', 'UTC',
];

export function TimezonePicker({ visible, value, onSelect, onClose }) {
  const [filter, setFilter] = useState('');
  let deviceTz = null;
  try { deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}

  const list = COMMON_TIMEZONES.filter(
    (tz) => tz.toLowerCase().includes(filter.toLowerCase()));
  if (deviceTz && !COMMON_TIMEZONES.includes(deviceTz)) list.unshift(deviceTz);

  return (
    <Sheet visible={visible} title="Timezone" onClose={onClose}>
      {deviceTz ? (
        <TouchableOpacity style={[s.tzRow, s.tzDevice]} onPress={() => { onSelect(deviceTz); onClose(); }}>
          <Text style={s.tzText}>📍 Use phone timezone ({deviceTz})</Text>
        </TouchableOpacity>
      ) : null}
      <TextInput
        style={s.tzFilter} value={filter} onChangeText={setFilter}
        placeholder="Type to filter… (e.g. London)" placeholderTextColor={colors.inkFaint}
        autoCapitalize="none"
      />
      <FlatList
        data={list} keyExtractor={(tz) => tz} style={{ maxHeight: 380 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.tzRow, item === value && s.tzOn]}
            onPress={() => { onSelect(item); onClose(); }}>
            <Text style={[s.tzText, item === value && { color: colors.blueDark }]}>
              {item === value ? '✓ ' : ''}{item.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />
    </Sheet>
  );
}

const s = StyleSheet.create({
  subLabel: { ...type.label, marginBottom: 8 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: {
    flex: 1, marginHorizontal: 2, paddingVertical: 9, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center',
  },
  dayChipOn: { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
  dayChipText: { fontSize: 11, fontWeight: '800', color: colors.inkSoft },
  dayChipTextOn: { color: colors.primaryDark },
  timeWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2 },
  timeChip: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: colors.primary,
    backgroundColor: colors.primary + '14', borderRadius: radius.pill,
    paddingVertical: 7, paddingHorizontal: 12, marginRight: 8, marginBottom: 8,
  },
  timeChipText: { fontSize: 14, fontWeight: '800', color: colors.primaryDark },
  timeChipX: { fontSize: 12, fontWeight: '800', color: colors.bad },
  addChip: {
    borderWidth: 2, borderColor: colors.line, borderStyle: 'dashed', borderRadius: radius.pill,
    paddingVertical: 7, paddingHorizontal: 14, marginRight: 8, marginBottom: 8, backgroundColor: colors.card,
  },
  addChipText: { fontSize: 14, fontWeight: '800', color: colors.blue },
  hint: { fontSize: 12, color: colors.inkSoft, marginTop: 6 },
  hourGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  hourCell: {
    width: '16.66%', paddingVertical: 9, alignItems: 'center',
  },
  hourCellOn: {},
  hourText: {
    fontSize: 14, fontWeight: '700', color: colors.ink, width: 42, textAlign: 'center',
    paddingVertical: 6, borderRadius: radius.pill, overflow: 'hidden',
  },
  hourTextOn: { backgroundColor: colors.primary, color: '#fff' },
  minRow: { flexDirection: 'row' },
  minCell: {
    flex: 1, marginHorizontal: 4, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center',
  },
  minCellOn: { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
  minText: { fontSize: 15, fontWeight: '800', color: colors.inkSoft },
  minTextOn: { color: colors.primaryDark },
  goalHead: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
  goalValue: { fontSize: 32, fontWeight: '800', color: colors.primaryDark },
  goalUnit: { fontSize: 14, fontWeight: '700', color: colors.inkSoft, marginLeft: 8 },
  goalScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  goalScaleTxt: { fontSize: 11, color: colors.inkFaint, fontWeight: '700' },
  tzFilter: {
    borderWidth: 2, borderColor: colors.line, borderRadius: radius.md,
    padding: 10, fontSize: 15, color: colors.ink, backgroundColor: colors.card,
    marginBottom: 8,
  },
  tzRow: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  tzDevice: { backgroundColor: colors.blue + '0D', borderRadius: radius.md, marginBottom: 8 },
  tzOn: { backgroundColor: colors.blue + '0D' },
  tzText: { ...type.body, fontWeight: '600' },
});
