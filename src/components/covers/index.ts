import type { ComponentType } from 'react';
import type { Theme } from '../../stories/types';
import { CoastArtwork } from './CoastArtwork';
import { OrbitArtwork } from './OrbitArtwork';
import { BakeryArtwork } from './BakeryArtwork';
import { WorkshopArtwork } from './WorkshopArtwork';
import { CityArtwork } from './CityArtwork';
import { ForestArtwork } from './ForestArtwork';
import { RailArtwork } from './RailArtwork';
import { ArchiveArtwork } from './ArchiveArtwork';

interface CoverDefinition {
  Artwork: ComponentType;
  className: string;
  description: string;
}

export const covers: Record<Theme, CoverDefinition> = {
  forest: {
    Artwork: ForestArtwork,
    className: 'forest-cover',
    description: 'Moonlit trees, a winding path, and an unfolded map',
  },
  winter: {
    Artwork: ForestArtwork,
    className: 'forest-cover winter-cover',
    description: 'A snowy forest path beneath a pale winter moon',
  },
  rail: {
    Artwork: RailArtwork,
    className: 'rail-cover',
    description: 'A lit railway carriage crossing a valley at dusk',
  },
  archive: {
    Artwork: ArchiveArtwork,
    className: 'archive-cover',
    description: 'An open book beneath a lamp in a quiet archive',
  },
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
