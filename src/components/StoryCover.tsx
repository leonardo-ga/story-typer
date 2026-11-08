import type { Story } from '../stories/types';

export function StoryCover({ story }: { story: Story }) {
  if (story.theme === 'bakery' || story.theme === 'workshop') {
    return (
      <div
        className={`art cover-art craft-cover ${story.theme}-cover`}
        role="img"
        aria-label={
          story.theme === 'bakery'
            ? 'A small copper dragon tending a glowing bread oven'
            : 'A violin and hand plane on a sunlit workbench'
        }
      >
        {story.theme === 'bakery' ? (
          <>
            <div className="oven-bricks" />
            <div className="oven-mouth">
              <div className="oven-glow" />
              <div className="dragon-head">
                <i />
                <b />
              </div>
            </div>
            <div className="bread-shelf">
              <i />
              <i />
              <i />
            </div>
          </>
        ) : (
          <>
            <div className="workshop-window" />
            <div className="workbench" />
            <div className="violin">
              <div className="violin-neck" />
              <div className="violin-upper" />
              <div className="violin-lower" />
              <div className="violin-strings" />
            </div>
            <div className="hand-plane" />
          </>
        )}
        <div className="art-caption">
          <span>{story.setting}</span>
          <strong>{story.caption}</strong>
        </div>
      </div>
    );
  }
  return story.theme === 'coast' ? (
    <div
      className="art cover-art"
      role="img"
      aria-label="A lighthouse on a quiet coast at night"
    >
      <div className="stars" />
      <div className="moon" />
      <div className="beam" />
      <div className="lighthouse">
        <div className="lantern" />
        <div className="tower" />
        <div className="door" />
      </div>
      <div className="cliff" />
      <div className="sea" />
      <div className="art-caption">
        <span>{story.setting}</span>
        <strong>{story.caption}</strong>
      </div>
    </div>
  ) : (
    <div
      className="art cover-art garden-cover"
      role="img"
      aria-label="A small seedling growing beneath a window overlooking Earth"
    >
      <div className="stars" />
      <div className="planet" />
      <div className="station-window" />
      <div className="seedling">
        <div className="plant-stem" />
        <div className="plant-leaf leaf-left" />
        <div className="plant-leaf leaf-right" />
        <div className="plant-pot" />
      </div>
      <div className="art-caption">
        <span>{story.setting}</span>
        <strong>{story.caption}</strong>
      </div>
    </div>
  );
}
