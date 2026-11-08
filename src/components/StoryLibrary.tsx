import { stories } from '../stories';
import type { Session } from '../types';
import { StoryCover } from './StoryCover';
import { analyzeTyping } from '../typing.mjs';

export function StoryLibrary({
  sessions,
}: {
  sessions: Record<string, Session>;
}) {
  return (
    <>
      <section className="library-intro">
        <span className="eyebrow">
          <span className="live-dot" /> A LITTLE PRACTICE. A DIFFERENT WORLD.
        </span>
        <h1 id="library-title">
          Find your next story<span>.</span>
        </h1>
        <p>Slow down. Settle in. Let your fingertips turn the pages.</p>
      </section>
      <section className="library" aria-labelledby="library-title">
        <div className="collection-heading">
          <h2>The collection</h2>
          <span>{stories.length} SHORT STORIES</span>
        </div>
        {stories.map((item) => {
          const saved = sessions[item.id];
          const target = item.paragraphs
            .map((part) => part.text.normalize('NFC'))
            .join(' ');
          const analysis = analyzeTyping(saved?.value ?? '', target);
          const savedProgress = saved
            ? Math.round((analysis.correct / analysis.total) * 100)
            : 0;
          return (
            <article className={`story-card theme-${item.theme}`} key={item.id}>
              <StoryCover story={item} />
              <div className="story-card-body">
                <span className="eyebrow">{item.genre.toUpperCase()}</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <div className="tags">
                  <span>{item.paragraphs.length} PARAGRAPHS</span>
                  <span>{item.duration.toUpperCase()}</span>
                </div>
                <a className="primary" href={`#${item.id}`}>
                  {saved?.finished
                    ? 'View your results'
                    : saved?.started
                      ? 'Continue story'
                      : 'Explore story'}{' '}
                  <span>→</span>
                </a>
                {saved?.started && !saved.finished && (
                  <span className="saved-progress">
                    {savedProgress}% complete · Saved for this visit
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </section>
      <footer className="library-footer">
        <p>Every story begins with a single keystroke.</p>
        <span>More stories to come</span>
      </footer>
    </>
  );
}
