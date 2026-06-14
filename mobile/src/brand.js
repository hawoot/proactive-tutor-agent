// The brand lives here and ONLY here. Name, story, voice, mascot art.
// Swapping the mascot or renaming the app should never touch a screen.
//
// Labib — a fennec, the little desert fox, and your study buddy. He shows up
// every day, coaches you through one question at a time, and guides you to the
// answer rather than handing it over.

export const BRAND = {
  appName: 'Labib',
  mascotName: 'Labib',
  tagline: 'Clever help, every day.',
  story: 'Labib is a fennec — the little desert fox — and he’s in your corner ' +
    'every day: one question at a time, guiding you through it rather than just ' +
    'handing over the answer.',
};

// Mascot poses. Keys are the vocabulary screens use; art is interchangeable.
export const MASCOT = {
  wave: require('../assets/mascot/wave.png'),        // greetings, onboarding
  think: require('../assets/mascot/think.png'),      // questions, loading
  celebrate: require('../assets/mascot/celebrate.png'), // correct answers, goals met
  coach: require('../assets/mascot/coach.png'),      // near misses, encouragement
  sleep: require('../assets/mascot/sleep.png'),      // quiet hours, all caught up
};

// The earned rank for a mastered skill.
export function masteryRank(score) {
  return score >= 0.9 ? 'Mastered 🏅' : null;
}

// Time-aware greeting for the Today screen.
export function greeting(hour) {
  if (hour < 5) return { pose: 'sleep', line: 'Up late?', sub: 'One question, then sleep on it — that’s how it sticks.' };
  if (hour < 12) return { pose: 'wave', line: 'Good morning ☀️', sub: 'Your brain is freshest right now.' };
  if (hour < 18) return { pose: 'wave', line: 'Ready when you are', sub: 'A question takes two minutes. Labib remembers the rest.' };
  if (hour < 22) return { pose: 'wave', line: 'Evening review time', sub: 'What you review tonight, you keep tomorrow.' };
  return { pose: 'sleep', line: 'Winding down', sub: 'One last question? Then Labib sleeps too.' };
}
