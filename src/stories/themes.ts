interface ThemeDefinition {
  animation: {
    kind: 'rain' | 'stars' | 'leaves' | 'snow' | 'dust' | 'tracks';
    label: string;
    clearAtEnding: boolean;
  } | null;
  ambience: {
    frequency: number;
    gain: number;
    texture: 'hum' | 'warmth' | 'clock' | 'wind' | 'train' | 'paper' | null;
  };
}

export const themes = {
  forest: {
    animation: { kind: 'leaves', label: 'Leaves', clearAtEnding: false },
    ambience: { frequency: 330, gain: 0.018, texture: 'wind' },
  },
  winter: {
    animation: { kind: 'snow', label: 'Snow', clearAtEnding: false },
    ambience: { frequency: 220, gain: 0.012, texture: 'wind' },
  },
  rail: {
    animation: {
      kind: 'tracks',
      label: 'Passing lights',
      clearAtEnding: false,
    },
    ambience: { frequency: 260, gain: 0.018, texture: 'train' },
  },
  archive: {
    animation: { kind: 'dust', label: 'Dust motes', clearAtEnding: false },
    ambience: { frequency: 500, gain: 0.006, texture: 'paper' },
  },
  coast: {
    animation: { kind: 'rain', label: 'Rain', clearAtEnding: true },
    ambience: { frequency: 450, gain: 0.035, texture: null },
  },
  orbit: {
    animation: { kind: 'stars', label: 'Stardust', clearAtEnding: false },
    ambience: { frequency: 120, gain: 0.035, texture: 'hum' },
  },
  bakery: {
    animation: null,
    ambience: { frequency: 200, gain: 0.035, texture: 'warmth' },
  },
  workshop: {
    animation: null,
    ambience: { frequency: 100, gain: 0.009, texture: 'clock' },
  },
  city: {
    animation: { kind: 'rain', label: 'Rain', clearAtEnding: true },
    ambience: { frequency: 350, gain: 0.035, texture: null },
  },
} satisfies Record<string, ThemeDefinition>;

export type Theme = keyof typeof themes;

export function getTheme(theme: Theme): ThemeDefinition {
  return themes[theme];
}
