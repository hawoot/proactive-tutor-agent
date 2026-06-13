// Nejma's design tokens: warm sand by day, night sky after dark.
// The scheme is resolved from the system ONCE at JS startup, before any
// StyleSheet.create runs, so every baked style gets the right palette.
// When the system theme flips mid-session, App.js reloads the JS bundle.
import { Appearance } from 'react-native';

const light = {
  // brand
  primary: '#E16B4C', primaryDark: '#C4543A',   // terracotta - the action colour
  blue: '#2E8FA8', blueDark: '#24788E',         // Mediterranean blue
  purple: '#9A6BB5', purpleDark: '#7E549A',     // plum
  orange: '#E89A3C', orangeDark: '#C77E27',     // amber gold
  red: '#D9534F', redDark: '#B54440',
  yellow: '#F4B942',
  mascot: '#F4B942', mascotDark: '#C08A2D',     // Nejma's gold
  // surfaces & text
  bg: '#FBF7F0',           // warm sand
  bgSoft: '#F3ECDF',
  card: '#FFFFFF',
  line: '#E9E0D1',
  ink: '#33302A',
  inkSoft: '#7C7468',
  inkFaint: '#B3AA9B',
  // semantic
  good: '#5FA866',
  warn: '#E89A3C',
  bad: '#D9534F',
  shared: '#2E8FA8',
  personal: '#9A6BB5',
};

const dark = {
  primary: '#E8795A', primaryDark: '#C05A3E',
  blue: '#4FA3BC', blueDark: '#3A88A0',
  purple: '#AC82C4', purpleDark: '#8F68A8',
  orange: '#E8A34F', orangeDark: '#C58234',
  red: '#E06661', redDark: '#B84B47',
  yellow: '#F4B942',
  mascot: '#F4B942', mascotDark: '#D9A53C',
  bg: '#14161F',           // the night sky where Nejma shines
  bgSoft: '#1B1E2B',
  card: '#202433',
  line: '#343950',
  ink: '#EDEEF6',
  inkSoft: '#9FA3B8',
  inkFaint: '#5F6378',
  good: '#6BB573',
  warn: '#E8A34F',
  bad: '#E06661',
  shared: '#4FA3BC',
  personal: '#AC82C4',
};

export const scheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
export const colors = scheme === 'dark' ? dark : light;

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };
export const pad = 16;

// Soft shadows make surfaces feel like floating cards (an app), not boxes with
// hard borders (a 90s web form). Dark mode leans on elevation; light mode on a
// warm, low-opacity drop shadow.
export const shadow = {
  sm: scheme === 'dark'
    ? { elevation: 3, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }
    : { elevation: 2, shadowColor: '#5b4a2e', shadowOpacity: 0.10, shadowRadius: 9, shadowOffset: { width: 0, height: 3 } },
  md: scheme === 'dark'
    ? { elevation: 7, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }
    : { elevation: 6, shadowColor: '#5b4a2e', shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
};

export const type = {
  hero: { fontSize: 26, fontWeight: '800', color: colors.ink },
  title: { fontSize: 19, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, lineHeight: 23, color: colors.ink },
  label: { fontSize: 13, fontWeight: '700', color: colors.inkSoft, letterSpacing: 0.6, textTransform: 'uppercase' },
  meta: { fontSize: 13, color: colors.inkSoft },
};

// Treat the backend's naive UTC timestamps correctly on-device.
export function utcDate(iso) {
  if (!iso) return null;
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : iso + 'Z');
}

export function timeOfDay(iso) {
  const d = utcDate(iso);
  return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

export function dayLabel(iso) {
  const d = utcDate(iso);
  if (!d) return '';
  const today = new Date(); const that = new Date(d);
  const diff = Math.floor((new Date(today.toDateString()) - new Date(that.toDateString())) / 86400000);
  if (diff <= 0) return `today ${timeOfDay(iso)}`;
  if (diff === 1) return `yesterday ${timeOfDay(iso)}`;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
