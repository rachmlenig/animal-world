const THEMES = {
  farm: {
    name: 'The Farm',
    bgGradient: ['#AEE4FF', '#87CEAF', '#7EC850'],
    accentColor: '#7EC850',
    player: { emoji: '\u{1F468}\u200D\u{1F33E}', label: 'Farmer' },
    food: { emoji: '\u{1F33D}', label: 'corn' },
    decorations: ['\u{1F33B}', '\u{1F33E}', '\u{1F3E0}'],
    animals: [
      { emoji: '\u{1F404}', name: 'Cow', sound: 'MOO!', freq: 180, type: 'sine' },
      { emoji: '\u{1F416}', name: 'Pig', sound: 'OINK!', freq: 220, type: 'sine' },
      { emoji: '\u{1F414}', name: 'Chicken', sound: 'CLUCK!', freq: 400, type: 'square' },
      { emoji: '\u{1F411}', name: 'Sheep', sound: 'BAA!', freq: 280, type: 'sine' },
      { emoji: '\u{1F986}', name: 'Duck', sound: 'QUACK!', freq: 320, type: 'sine' },
      { emoji: '\u{1F434}', name: 'Horse', sound: 'NEIGH!', freq: 240, type: 'sawtooth' },
    ],
  },
};

export default THEMES;
