import { memo, useMemo, type RefObject } from 'react';
import { matchCharacter, segmentText } from '../typing.mjs';
import type { getStoryText } from '../stories/text';

interface Props {
  part: ReturnType<typeof getStoryText>['paragraphs'][number];
  typedText: string;
  cursor: number;
  current: boolean;
  past: boolean;
  final: boolean;
  language: string;
  assistance: boolean;
  label: string;
  activeRef?: RefObject<HTMLElement>;
}

/** Unchanged paragraphs do not rebuild thousands of spans on timer ticks. */
export const StoryParagraph = memo(function StoryParagraph({
  part,
  typedText,
  cursor,
  current,
  past,
  final,
  language,
  assistance,
  label,
  activeRef,
}: Props) {
  const typed = useMemo(() => segmentText(typedText), [typedText]);
  return (
    <section
      ref={activeRef}
      className={`stream-paragraph ${current ? 'current-paragraph' : past ? 'past-paragraph' : 'future-paragraph'}`}
      aria-current={current ? 'step' : undefined}
      aria-label={label}
    >
      <p className="passage" lang={language} aria-hidden="true">
        {part.characters.map(({ char, start }, index) => (
          <span
            key={start}
            className={`${typed[index] ? matchCharacter(typed[index].char, char, assistance) : 'pending'} ${start === cursor ? 'cursor' : ''}`}
          >
            {char}
          </span>
        ))}
        {final && cursor >= part.text.length && (
          <span className="cursor"> </span>
        )}
      </p>
    </section>
  );
});
