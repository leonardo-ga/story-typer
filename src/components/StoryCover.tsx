import type { Story } from '../stories/types';
import { covers } from './covers';

export function StoryCover({ story }: { story: Story }) {
  const { Artwork, className, description } = covers[story.theme];
  return (
    <div
      className={`art cover-art ${className}`}
      role="img"
      aria-label={description}
    >
      <Artwork />
      <div className="art-caption">
        <span>{story.setting}</span>
        <strong>{story.caption}</strong>
      </div>
    </div>
  );
}
