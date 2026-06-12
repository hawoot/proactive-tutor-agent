// Bright & playful design tokens. One source of truth for colour, spacing
// and type so every screen feels like the same app.
export const colors = {
  // brand
  primary: '#58CC02', primaryDark: '#4BA802',   // action green
  blue: '#1CB0F6', blueDark: '#1899D6',
  purple: '#CE82FF', purpleDark: '#A568CC',
  orange: '#FF9600', orangeDark: '#CC7800',
  red: '#FF4B4B', redDark: '#CC3B3B',
  yellow: '#FFC800',
  // surfaces & text
  bg: '#FFFFFF',
  bgSoft: '#F7F7F7',
  card: '#FFFFFF',
  line: '#E5E5E5',
  ink: '#3C3C3C',
  inkSoft: '#777777',
  inkFaint: '#AFAFAF',
  // semantic
  good: '#58CC02',
  warn: '#FF9600',
  bad: '#FF4B4B',
  shared: '#1CB0F6',
  personal: '#CE82FF',
};

export const radius = { sm: 10, md: 14, lg: 18, pill: 999 };
export const pad = 16;

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
