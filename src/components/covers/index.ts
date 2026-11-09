import type { ComponentType } from 'react';
import type { Theme } from '../../stories/types';
import { CoastArtwork } from './CoastArtwork';
import { OrbitArtwork } from './OrbitArtwork';
import { BakeryArtwork } from './BakeryArtwork';
import { WorkshopArtwork } from './WorkshopArtwork';
import { CityArtwork } from './CityArtwork';

interface CoverDefinition {
  Artwork: ComponentType;
  className: string;
  description: string;
}

export const covers: Record<Theme, CoverDefinition> = {
  coast: {
    Artwork: CoastArtwork,
    className: '',
    description: 'A lighthouse on a quiet coast at night',
  },
  orbit: {
    Artwork: OrbitArtwork,
    className: 'garden-cover',
    description: 'A small seedling growing beneath a window overlooking Earth',
  },
  bakery: {
    Artwork: BakeryArtwork,
    className: 'craft-cover bakery-cover',
    description: 'A small copper dragon tending a glowing bread oven',
  },
  workshop: {
    Artwork: WorkshopArtwork,
    className: 'craft-cover workshop-cover',
    description: 'A violin and hand plane on a sunlit workbench',
  },
  city: {
    Artwork: CityArtwork,
    className: 'city-cover',
    description:
      'A yellow button beneath a bus shelter, with raindrops suspended in the night air',
  },
};
