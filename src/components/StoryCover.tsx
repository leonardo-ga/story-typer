import type { Story } from '../stories/types';
import { covers } from './covers';
import { useI18n } from '../i18n/I18nProvider';

export function StoryCover({ story }: { story: Story }) {
  const { text } = useI18n();
  const { Artwork, className, description } = covers[story.theme];
  return (
    <div
      className={`art cover-art ${className}`}
      role="img"
      aria-label={text(description)}
    >
      <Artwork />
      <div className="art-caption" lang={story.language}>
        <span>{story.setting}</span>
        <strong>{story.caption}</strong>
      </div>
    </div>
  );
}
