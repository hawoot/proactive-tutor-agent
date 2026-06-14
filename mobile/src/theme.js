// Labib's design tokens — editorial & warm: a warm-sand day, a warm plum-black
// night, with an amber-gold action colour throughout.
// The scheme is resolved from the system ONCE at JS startup, before any
// StyleSheet.create runs, so every baked style gets the right palette.
// When the system theme flips mid-session, App.js reloads the JS bundle.
import { Appearance } from 'react-native';

const light = {
  // brand
  primary: '#F2A62A', primaryDark: '#D6891A',   // amber-gold - the action colour
  blue: '#3F94AE', blueDark: '#2E788F',         // Mediterranean blue
  purple: '#A66FC8', purpleDark: '#8A55AC',     // plum
  orange: '#E8763A', orangeDark: '#C75D27',     // warm terracotta-orange
  red: '#D9534F', redDark: '#B54440',
  yellow: '#F2A62A',
  mascot: '#F0A861', mascotDark: '#D9883C',     // Labib's sandy fur
  // surfaces & text
  bg: '#FBF6EE',           // warm sand
  bgSoft: '#F4ECDF',
  card: '#FFFFFF',
  line: '#ECE2D1',
  ink: '#2E2A24',
  inkSoft: '#8C8475',
  inkFaint: '#B6AD9C',
  // semantic
  good: '#3FA06B',
  warn: '#E8763A',
  bad: '#D9534F',
  shared: '#3F94AE',
  personal: '#A66FC8',
};

const dark = {
  primary: '#F5B73F', primaryDark: '#D99A28',   // amber-gold on the night sky
  blue: '#5FB6D0', blueDark: '#3F94AE',
  purple: '#C68FE6', purpleDark: '#A66FC8',
  orange: '#F0903F', orangeDark: '#D0762A',
  red: '#E0563B', redDark: '#C13F28',
  yellow: '#F5B73F',
  mascot: '#F0A861', mascotDark: '#D9883C',
  bg: '#17131D',           // warm plum-black - the night Labib glows against
  bgSoft: '#1F1A28',
  card: '#221C2B',
  line: '#332B42',
  ink: '#F3EFEA',
  inkSoft: '#9890A6',
  inkFaint: '#6B6478',
  good: '#46C186',
  warn: '#F0903F',
  bad: '#E0563B',
  shared: '#5FB6D0',
  personal: '#C68FE6',
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
