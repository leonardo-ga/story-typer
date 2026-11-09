import { useState } from 'react';

export const storyEditionsKey = 'story-typer.story-editions.v1';

function readEditions(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(storyEditionsKey) ?? '{}',
    );
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, edition]) => typeof edition === 'string',
      ),
    );
  } catch {
    return {};
  }
}

export function useStoryEditions() {
  const [selectedEditions, setSelectedEditions] = useState(readEditions);
  function selectEdition(storyId: string, editionId: string) {
    const next = { ...selectedEditions, [storyId]: editionId };
    setSelectedEditions(next);
    try {
      localStorage.setItem(storyEditionsKey, JSON.stringify(next));
    } catch {
      // Selection still works when browser storage is unavailable.
    }
  }
  return { selectedEditions, selectEdition };
}
