interface ThemeDefinition {
  animation: {
    kind: 'rain' | 'stars';
    label: string;
    clearAtEnding: boolean;
  } | null;
  ambience: {
    frequency: number;
    gain: number;
    texture: 'hum' | 'warmth' | 'clock' | null;
  };
}

export const themes = {
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
