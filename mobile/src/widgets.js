// Visual controls: paint-the-week schedule grid (with two-way linked table),
// a notch slider for the daily goal, and a pick-from-list timezone sheet.
// Rule of the house: fewer forms, more touching.
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Sheet } from './components';
import { colors, radius, type } from './theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALL = [0, 1, 2, 3, 4, 5, 6];

// One-tap starting points; the grid below is for fine-tuning. Tapping a
// preset adds its hours; tapping again (when fully on) removes them.
const PRESETS = [
  { label: '🌅 Mornings', windows: ALL.map((d) => ({ weekday: d, start_hour: 7, end_hour: 9 })) },
  { label: '🥪 Lunch breaks', windows: [0, 1, 2, 3, 4].map((d) => ({ weekday: d, start_hour: 12, end_hour: 14 })) },
  { label: '🌙 Evenings', windows: ALL.map((d) => ({ weekday: d, start_hour: 18, end_hour: 22 })) },
  { label: '🛋️ Weekends', windows: [5, 6].map((d) => ({ weekday: d, start_hour: 10, end_hour: 20 })) },
];

// --- windows <-> grid helpers -------------------------------------------------

function windowsToGrid(windows) {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(false));
  for (const w of windows || []) {
    for (let h = w.start_hour; h < w.end_hour; h++) grid[w.weekday][h] = true;
  }
  return grid;
}

function gridToWindows(grid) {
  const windows = [];
  grid.forEach((day, weekday) => {
    let start = null;
    for (let h = 0; h <= 24; h++) {
      const on = h < 24 && day[h];
      if (on && start === null) start = h;
      if (!on && start !== null) {
        windows.push({ weekday, start_hour: start, end_hour: h });
        start = null;
      }
    }
  });
  return windows;
}

// --- WeekSchedule ----------------------------------------------------------------

export function WeekSchedule({ windows, onChange }) {
  const grid = useMemo(() => windowsToGrid(windows), [windows]);

  const toggle = (d, h) => {
    const g = grid.map((row) => [...row]);
    g[d][h] = !g[d][h];
    onChange(gridToWindows(g));
  };

  const adjust = (idx, field, delta) => {
    const next = windows.map((w, i) => i === idx ? { ...w, [field]: w[field] + delta } : w);
    const w = next[idx];
    if (w.start_hour < 0 || w.end_hour > 24 || w.end_hour <= w.start_hour) return;
    onChange(gridToWindows(windowsToGrid(next)));  // normalise overlaps/merges
  };

  const removeWindow = (idx) => onChange(windows.filter((_, i) => i !== idx));

  const copyMondayToAll = () => {
    const monday = windows.filter((w) => w.weekday === 0);
    onChange(ALL.flatMap((d) => monday.map((w) => ({ ...w, weekday: d }))));
  };

  const presetActive = (p) => p.windows.every((w) => {
    for (let h = w.start_hour; h < w.end_hour; h++) if (!grid[w.weekday][h]) return false;
    return true;
  });

  const togglePreset = (p) => {
    const g = grid.map((row) => [...row]);
    const on = !presetActive(p);
    for (const w of p.windows) {
      for (let h = w.start_hour; h < w.end_hour; h++) g[w.weekday][h] = on;
    }
    onChange(gridToWindows(g));
  };

  return (
    <View>
      {/* presets first, grid for fine-tuning */}
      <View style={s.presetRow}>
        {PRESETS.map((p) => {
          const on = presetActive(p);
          return (
            <TouchableOpacity key={p.label} onPress={() => togglePreset(p)}
              style={[s.presetChip, on && s.presetChipOn]}>
              <Text style={[s.presetText, on && s.presetTextOn]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
        {windows.length > 0 && (
          <TouchableOpacity onPress={() => onChange([])} style={s.presetChip}>
            <Text style={s.presetText}>✕ Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* hour scale */}
      <View style={s.scaleRow}>
        <View style={{ width: 36 }} />
        {[0, 6, 12, 18].map((h) => (
          <Text key={h} style={s.scaleText}>{h}:00</Text>
        ))}
        <Text style={[s.scaleText, { flex: 0 }]}>24</Text>
      </View>

      {/* the paintable grid */}
      {DAYS.map((day, d) => (
        <View key={day} style={s.dayRow}>
          <Text style={s.dayLabel}>{day}</Text>
          <View style={s.cellsRow}>
            {grid[d].map((on, h) => (
              <TouchableOpacity
                key={h}
                style={[s.cell, on && s.cellOn,
                  h % 6 === 0 && h > 0 && { marginLeft: 3 }]}
                onPress={() => toggle(d, h)}
              />
            ))}
          </View>
        </View>
      ))}
      <Text style={s.hint}>Tap a preset, then fine-tune by painting hours. Filled = Nejma may nudge you.</Text>
      <TouchableOpacity onPress={copyMondayToAll} style={{ marginTop: 6 }}>
        <Text style={s.copyLink}>📋 Copy Monday to every day</Text>
      </TouchableOpacity>

      {/* the linked table - edits here repaint the grid above */}
      {windows.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {windows.map((w, i) => (
            <View key={`${w.weekday}-${w.start_hour}-${i}`} style={s.windowRow}>
              <Text style={s.windowDay}>{DAYS[w.weekday]}</Text>
              <Nudger value={`${pad2(w.start_hour)}:00`}
                onDown={() => adjust(i, 'start_hour', -1)} onUp={() => adjust(i, 'start_hour', +1)} />
              <Text style={s.windowDash}>→</Text>
              <Nudger value={`${pad2(w.end_hour)}:00`}
                onDown={() => adjust(i, 'end_hour', -1)} onUp={() => adjust(i, 'end_hour', +1)} />
              <TouchableOpacity onPress={() => removeWindow(i)} style={{ padding: 6 }}>
                <Text style={{ color: colors.bad, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {windows.length === 0 && (
        <Text style={[s.hint, { color: colors.orangeDark, marginTop: 8 }]}>
          No allowed hours = no nudges at all. Tap a preset or paint at least one block.
        </Text>
      )}
    </View>
  );
}

function pad2(n) { return String(n).padStart(2, '0'); }

function Nudger({ value, onDown, onUp }) {
  return (
    <View style={s.nudger}>
      <TouchableOpacity onPress={onDown} style={s.nudgeBtn}><Text style={s.nudgeText}>‹</Text></TouchableOpacity>
      <Text style={s.nudgeValue}>{value}</Text>
      <TouchableOpacity onPress={onUp} style={s.nudgeBtn}><Text style={s.nudgeText}>›</Text></TouchableOpacity>
    </View>
  );
}

// --- GoalSlider --------------------------------------------------------------------

export function GoalSlider({ value, onChange, max = 10 }) {
  const v = Math.max(0, parseInt(value, 10) || 0);
  return (
    <View style={s.sliderRow}>
      <View style={s.notchRow}>
        {[...Array(max)].map((_, i) => {
          const n = i + 1;
          const on = v >= n;
          return (
            <TouchableOpacity key={n} style={s.notchTap} onPress={() => onChange(n)}>
              <View style={[s.notch, on && s.notchOn, v === n && s.notchCurrent]}>
                {v === n ? <Text style={s.notchLabel}>{n}</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <TextInput
        style={s.sliderInput} keyboardType="numeric"
        value={String(value)} onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
      />
    </View>
  );
}

// --- TimezonePicker -------------------------------------------------------------------

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
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  presetChip: {
    borderWidth: 2, borderColor: colors.line, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 6,
    backgroundColor: colors.card,
  },
  presetChipOn: { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
  presetText: { fontSize: 13, fontWeight: '700', color: colors.inkSoft },
  presetTextOn: { color: colors.primaryDark },
  scaleRow: { flexDirection: 'row', marginBottom: 4 },
  scaleText: { flex: 1, fontSize: 10, color: colors.inkFaint, fontWeight: '700' },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dayLabel: { width: 36, fontSize: 12, fontWeight: '800', color: colors.inkSoft },
  cellsRow: { flex: 1, flexDirection: 'row' },
  cell: {
    flex: 1, height: 26, backgroundColor: colors.line, marginHorizontal: 0.5,
    borderRadius: 3,
  },
  cellOn: { backgroundColor: colors.primary },
  hint: { fontSize: 12, color: colors.inkSoft, marginTop: 6 },
  copyLink: { fontSize: 13, fontWeight: '700', color: colors.blue },
  windowRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  windowDay: { width: 40, fontWeight: '800', color: colors.ink },
  windowDash: { color: colors.inkFaint, fontWeight: '800' },
  nudger: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 2,
    borderColor: colors.line, borderRadius: radius.pill, overflow: 'hidden',
  },
  nudgeBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  nudgeText: { fontSize: 16, fontWeight: '800', color: colors.blue },
  nudgeValue: { fontSize: 14, fontWeight: '700', color: colors.ink, minWidth: 48, textAlign: 'center' },
  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  notchRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  notchTap: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  notch: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  notchOn: { backgroundColor: colors.primary },
  notchCurrent: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: colors.primaryDark,
  },
  notchLabel: { color: '#fff', fontWeight: '800', fontSize: 12 },
  sliderInput: {
    width: 60, marginLeft: 10, borderWidth: 2, borderColor: colors.line,
    borderRadius: radius.md, padding: 8, fontSize: 16, fontWeight: '800',
    textAlign: 'center', color: colors.ink, backgroundColor: colors.card,
  },
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
