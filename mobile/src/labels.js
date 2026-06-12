// Human words for machine enums - users should never read 'due_then_weakest'.
import { colors } from './theme';

export const POLICY_LABELS = {
  question_source: {
    title: 'Where questions come from',
    options: {
      bank_first: { label: 'Curated first', hint: 'Trusted hand-written questions; the AI improvises only when the bank runs dry.' },
      bank_only: { label: 'Curated only', hint: 'Strictly the hand-written question bank.' },
      generate_only: { label: 'Creative', hint: 'The AI writes a fresh question every time.' },
    },
  },
  selection_strategy: {
    title: 'What to practise next',
    options: {
      due_then_weakest: { label: 'Smart review', hint: 'Skills due for review first, then your weakest.' },
      due_then_unseen: { label: 'Cover everything', hint: 'Reviews first, then skills you have never tried.' },
      round_robin: { label: 'Rotate evenly', hint: 'Cycle through all skills in turn.' },
    },
  },
  marking_strictness: {
    title: 'Marking style',
    options: {
      strict: { label: 'Strict examiner', hint: 'Full method required; slips cost marks.' },
      balanced: { label: 'Balanced', hint: 'Right method with small slips earns partial credit.' },
      lenient: { label: 'Encouraging', hint: 'Generous credit for the right idea.' },
    },
  },
  question_style: {
    title: 'Maths notation',
    options: {
      plain: { label: 'Phone-friendly', hint: 'Plain text like x^2 and sqrt(x).' },
      latex: { label: 'LaTeX allowed', hint: 'For when proper rendering arrives.' },
    },
  },
};

export const VERDICTS = {
  correct: { label: 'Correct!', emoji: '🎉', color: colors.good },
  partial: { label: 'Almost there', emoji: '💪', color: colors.warn },
  wrong: { label: 'Not quite', emoji: '📖', color: colors.bad },
  skipped: { label: 'Skipped', emoji: '⏭️', color: colors.inkFaint },
};

export const EFFORT_LABELS = { quick: '⚡ quick', deep: '🧠 deep' };
