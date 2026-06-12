// The brand lives here and ONLY here. Name, story, voice, mascot art.
// Swapping the mascot or renaming the app should never touch a screen.
//
// Nejma — نجمة, Tunisian for "star". Same root as "tnejjem!" (تنجّم), how
// you tell someone "you've got this". She drops the occasional Tunisian
// word, always with enough context to learn it. Master a skill and she
// gives you the craftsman's title: ma'allem (معلّم).

export const BRAND = {
  appName: 'Tnejjem',
  mascotName: 'Nejma',
  tagline: 'You can.',
  story: '“Tnejjem!” (تنجّم) is Tunisian for “you can — you’ve got this.” ' +
    'Your star is called Nejma: same root, because every time she shows up, ' +
    'that’s the message.',
};

// Mascot poses. Keys are the vocabulary screens use; art is interchangeable.
export const MASCOT = {
  wave: require('../assets/mascot/wave.png'),        // greetings, onboarding
  think: require('../assets/mascot/think.png'),      // questions, loading
  celebrate: require('../assets/mascot/celebrate.png'), // correct answers, goals met
  coach: require('../assets/mascot/coach.png'),      // near misses, encouragement
  sleep: require('../assets/mascot/sleep.png'),      // quiet hours, all caught up
};

// The earned rank for a mastered skill: the craftsman's title.
export function masteryRank(score) {
  return score >= 0.9 ? 'Ma’allem 🏅' : null;
}

// Time-aware greeting for the Today screen. One Tunisian word, translated
// by context, never more.
export function greeting(hour) {
  if (hour < 5) return { pose: 'sleep', line: 'Up late?', sub: 'One question, then sleep on it — that’s how it sticks.' };
  if (hour < 12) return { pose: 'wave', line: 'Sbeh el khir! ☀️', sub: 'Good morning — your brain is freshest right now.' };
  if (hour < 18) return { pose: 'wave', line: 'Ready when you are', sub: 'A question takes two minutes. Nejma remembers the rest.' };
  if (hour < 22) return { pose: 'wave', line: 'Evening review time', sub: 'What you review tonight, you keep tomorrow.' };
  return { pose: 'sleep', line: 'Winding down', sub: 'One last question? Then Nejma sleeps too.' };
}
