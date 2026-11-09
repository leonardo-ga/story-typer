import React, { act, useState } from 'react';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'http://localhost/',
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
});
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollTo = () => {};
window.matchMedia = () => ({ matches: false }) as MediaQueryList;
// jsdom has no top-layer dialog implementation; exercise application lifecycle here.
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
  (this.querySelector('[autofocus]') as HTMLElement | null)?.focus();
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};
let hidden = false;
Object.defineProperty(document, 'hidden', {
  configurable: true,
  get: () => hidden,
});

// Import React DOM after the browser environment exists.
const { createRoot } = await import('react-dom/client');
const { Simulate } = await import('react-dom/test-utils');
const { App } = await import('../src/App');
const { useCompositionInput } = await import(
  '../src/hooks/useCompositionInput'
);
const { EffectToggle } = await import('../src/components/EffectToggle');
const { SingleSelect } = await import('../src/components/SingleSelect');
const { preferencesSuggestionDelay } = await import(
  '../src/hooks/usePreferencesSuggestion'
);
const { stories } = await import('../src/stories');
const container = document.getElementById('root')!;
let root: ReturnType<typeof createRoot> | undefined;
async function mount(content: React.ReactNode) {
  root = createRoot(container);
  await act(async () => root!.render(content));
}
async function chooseOption(trigger: HTMLButtonElement, value: string) {
  await act(async () => trigger.click());
  const option = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="option"]'),
  ].find((option) => option.dataset.value === value)!;
  assert.ok(option, 'Missing option: ' + value);
  await act(async () => option.click());
}

function controlSuggestionTime() {
  const originalSet = window.setTimeout;
  const originalClear = window.clearTimeout;
  let time = 0;
  let nextId = -1;
  const pending = new Map<number, { at: number; run: () => void }>();
  window.setTimeout = ((
    handler: TimerHandler,
    delay?: number,
    ...args: unknown[]
  ) => {
    if (delay === preferencesSuggestionDelay && typeof handler === 'function') {
      const id = nextId--;
      pending.set(id, { at: time + delay, run: () => handler(...args) });
      return id;
    }
    return originalSet.call(window, handler, delay, ...args);
  }) as typeof window.setTimeout;
  window.clearTimeout = (id?: number) => {
    if (!pending.delete(id!)) originalClear.call(window, id);
  };
  return {
    advance: async (milliseconds: number) =>
      act(async () => {
        time += milliseconds;
        for (const [id, task] of pending)
          if (task.at <= time) {
            pending.delete(id);
            task.run();
          }
      }),
    restore: () => {
      window.setTimeout = originalSet;
      window.clearTimeout = originalClear;
    },
  };
}

function controlPageScroll() {
  const originalY = Object.getOwnPropertyDescriptor(window, 'scrollY');
  const originalHeight = Object.getOwnPropertyDescriptor(
    document.documentElement,
    'scrollHeight',
  );
  let y = 0;
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => y,
  });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 3000,
  });
  return {
    to: async (position: number) =>
      act(async () => {
        y = position;
        window.dispatchEvent(new dom.window.Event('scroll'));
      }),
    restore: () => {
      if (originalY) Object.defineProperty(window, 'scrollY', originalY);
      else Reflect.deleteProperty(window, 'scrollY');
      if (originalHeight)
        Object.defineProperty(
          document.documentElement,
          'scrollHeight',
          originalHeight,
        );
      else Reflect.deleteProperty(document.documentElement, 'scrollHeight');
    },
  };
}

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  hidden = false;
  localStorage.clear();
  window.sessionStorage.clear();
  Reflect.deleteProperty(navigator, 'keyboard');
  window.history.replaceState(null, '', '/');
});

test('browser language supplies defaults without saving them; explicit site and reading choices survive reload', async () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(
    navigator,
    'language',
  );
  Object.defineProperty(navigator, 'language', {
    configurable: true,
    value: 'it-IT',
  });
  const clock = controlSuggestionTime();
  try {
    await mount(<App />);
    assert.equal(document.documentElement.lang, 'it');
    assert.equal(localStorage.getItem('story-typer.preferences.v1'), null);
    await clock.advance(preferencesSuggestionDelay);
    assert.match(
      container.querySelector('.preferences-suggestion')!.textContent!,
      /Modifica le preferenze se necessario/,
    );
    await act(async () =>
      (
        container.querySelector(
          '.preferences-suggestion-open',
        ) as HTMLButtonElement
      ).click(),
    );
    const site = container.querySelector(
      '.preferred-language .single-select-trigger',
    ) as HTMLButtonElement;
    assert.equal(site.value, 'it');
    assert.match(
      container.querySelector('.keyboard-controls .single-select-trigger')!
        .textContent!,
      /Non impostata/,
    );
    await chooseOption(site, 'en');
    assert.deepEqual(
      JSON.parse(localStorage.getItem('story-typer.preferences.v1')!)
        .readingLanguages,
      ['it', 'en'],
    );
    await act(async () =>
      (
        container.querySelector('.multi-select-trigger') as HTMLButtonElement
      ).click(),
    );
    await act(async () =>
      (
        container.querySelector('.multi-select-clear') as HTMLButtonElement
      ).click(),
    );
    await act(async () => root!.unmount());
    root = undefined;
    await mount(<App />);
    assert.equal(document.documentElement.lang, 'en');
    await act(async () =>
      (
        container.querySelector('.settings-trigger') as HTMLButtonElement
      ).click(),
    );
    assert.match(
      container.querySelector('.multi-select-trigger')!.textContent!,
      /No preference/,
    );
  } finally {
    clock.restore();
    if (originalLanguage)
      Object.defineProperty(navigator, 'language', originalLanguage);
    else Reflect.deleteProperty(navigator, 'language');
  }
});

test('home header reveals on upward scrolling without jitter, stays visible for focus, and stays steady on story pages', async () => {
  const scroll = controlPageScroll();
  localStorage.setItem(
    'story-typer.preferences.v1',
    JSON.stringify({ siteLanguage: 'en' }),
  );
  try {
    await mount(<App />);
    const header = container.querySelector('header')!;
    assert.equal(header.dataset.hidden, 'false');
    await scroll.to(160);
    assert.equal(header.dataset.hidden, 'true');
    await scroll.to(155);
    await scroll.to(150);
    assert.equal(header.dataset.hidden, 'true');
    await scroll.to(148);
    assert.equal(header.dataset.hidden, 'false');
    await scroll.to(153);
    assert.equal(header.dataset.hidden, 'false');
    await scroll.to(172);
    assert.equal(header.dataset.hidden, 'true');
    const preferences = container.querySelector(
      '.settings-trigger',
    ) as HTMLButtonElement;
    await act(async () => {
      document.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
      );
      preferences.focus();
    });
    assert.equal(header.dataset.hidden, 'false');
    await scroll.to(500);
    assert.equal(header.dataset.hidden, 'false');
    await act(async () => preferences.blur());
    await scroll.to(530);
    assert.equal(header.dataset.hidden, 'true');
    await scroll.to(0);
    assert.equal(header.dataset.hidden, 'false');
    await act(async () => {
      window.history.replaceState(null, '', '/#last-frequency');
      window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
    });
    await scroll.to(800);
    assert.equal(header.dataset.hidden, 'false');
    assert.equal(header.classList.contains('site-header--reveal'), false);
  } finally {
    scroll.restore();
  }
});

test('closing preferences after a pointer click does not leave the header pinned; pointer scrolling releases keyboard pinning', async () => {
  const scroll = controlPageScroll();
  localStorage.setItem(
    'story-typer.preferences.v1',
    JSON.stringify({ siteLanguage: 'en' }),
  );
  try {
    await mount(<App />);
    const header = container.querySelector('header')!;
    const trigger = container.querySelector(
      '.settings-trigger',
    ) as HTMLButtonElement;
    await scroll.to(200);
    await scroll.to(180);
    await act(async () => {
      trigger.dispatchEvent(
        new dom.window.Event('pointerdown', { bubbles: true }),
      );
      trigger.focus();
      trigger.click();
    });
    await act(async () =>
      (container.querySelector('.dialog-close') as HTMLButtonElement).click(),
    );
    assert.equal(document.activeElement, trigger);
    await scroll.to(220);
    assert.equal(header.dataset.hidden, 'true');
    await act(async () => {
      document.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
      );
      trigger.focus();
    });
    assert.equal(header.dataset.hidden, 'false');
    await scroll.to(300);
    assert.equal(header.dataset.hidden, 'false');
    await act(async () => window.dispatchEvent(new dom.window.Event('wheel')));
    await scroll.to(340);
    assert.equal(header.dataset.hidden, 'true');
    assert.equal(document.activeElement, trigger);
  } finally {
    scroll.restore();
  }
});

test('preferences suggestions and the preferences dialog pin the home header while scrolling', async () => {
  const scroll = controlPageScroll();
  const clock = controlSuggestionTime();
  try {
    await mount(<App />);
    const header = container.querySelector('header')!;
    await scroll.to(200);
    assert.equal(header.dataset.hidden, 'true');
    await clock.advance(preferencesSuggestionDelay);
    assert.equal(header.dataset.hidden, 'false');
    await scroll.to(400);
    assert.equal(header.dataset.hidden, 'false');
    await act(async () =>
      (
        container.querySelector(
          '.preferences-suggestion-open',
        ) as HTMLButtonElement
      ).click(),
    );
    await scroll.to(600);
    assert.equal(header.dataset.hidden, 'false');
    assert.ok(container.querySelector('dialog[open]'));
  } finally {
    clock.restore();
    scroll.restore();
  }
});

test('new visitors receive a delayed suggestion that opens preferences without repeating', async () => {
  const clock = controlSuggestionTime();
  try {
    await mount(<App />);
    assert.equal(container.querySelector('.preferences-suggestion'), null);
    await clock.advance(preferencesSuggestionDelay - 1);
    assert.equal(container.querySelector('.preferences-suggestion'), null);
    await clock.advance(1);
    assert.ok(container.querySelector('.preferences-suggestion'));
    assert.ok(
      container.querySelector('.preferences-anchor > .settings-trigger'),
    );
    assert.ok(
      container.querySelector('.preferences-anchor > .preferences-suggestion'),
    );
    assert.equal(container.querySelector('dialog'), null);
    await act(async () =>
      (
        container.querySelector(
          '.preferences-suggestion-open',
        ) as HTMLButtonElement
      ).click(),
    );
    assert.ok(container.querySelector('dialog[open]'));
    assert.equal(container.querySelector('.preferences-suggestion'), null);
    await act(async () =>
      (container.querySelector('.dialog-close') as HTMLButtonElement).click(),
    );
    await clock.advance(preferencesSuggestionDelay);
    assert.equal(container.querySelector('.preferences-suggestion'), null);
    await act(async () => root!.unmount());
    root = undefined;
    await mount(<App />);
    await clock.advance(preferencesSuggestionDelay);
    assert.equal(container.querySelector('.preferences-suggestion'), null);
  } finally {
    clock.restore();
  }
});

test('Not now snoozes only the tab session and Escape has the same temporary behavior', async () => {
  const clock = controlSuggestionTime();
  async function remount() {
    await act(async () => root!.unmount());
    root = undefined;
    await mount(<App />);
  }
  try {
    await mount(<App />);
    await clock.advance(preferencesSuggestionDelay);
    assert.equal(
      container
        .querySelector('.preferences-suggestion .dialog-close')!
        .getAttribute('title'),
      'Don’t show again',
    );
    await act(async () =>
      (
        container.querySelector(
          '.preferences-suggestion-later',
        ) as HTMLButtonElement
      ).click(),
    );
    assert.equal(container.querySelector('dialog'), null);
    assert.equal(
      document.activeElement,
      container.querySelector('.settings-trigger'),
    );
    assert.equal(
      localStorage.getItem('story-typer.preferences-suggestion.dismissed'),
      null,
    );
    assert.equal(localStorage.getItem('story-typer.preferences.v1'), null);
    await clock.advance(preferencesSuggestionDelay);
    assert.equal(container.querySelector('.preferences-suggestion'), null);
    await remount();
    await clock.advance(preferencesSuggestionDelay);
    assert.equal(container.querySelector('.preferences-suggestion'), null);
    window.sessionStorage.clear(); // A new tab session can receive the suggestion again.
    await remount();
    await clock.advance(preferencesSuggestionDelay);
    assert.ok(container.querySelector('.preferences-suggestion'));
    await act(async () =>
      Simulate.keyDown(container.querySelector('.preferences-suggestion')!, {
        key: 'Escape',
      }),
    );
    assert.equal(container.querySelector('.preferences-suggestion'), null);
    assert.equal(
      localStorage.getItem('story-typer.preferences-suggestion.dismissed'),
      null,
    );
    assert.equal(
      document.activeElement,
      container.querySelector('.settings-trigger'),
    );
  } finally {
    clock.restore();
  }
});

test('dismissed suggestions stay dismissed across visits; configured visitors and active readers get no suggestion', async () => {
  const clock = controlSuggestionTime();
  async function remount() {
    await act(async () => root!.unmount());
    root = undefined;
    await mount(<App />);
  }
  try {
    await mount(<App />);
    await clock.advance(preferencesSuggestionDelay);
    await act(async () =>
      (
        container.querySelector(
          '.preferences-suggestion .dialog-close',
        ) as HTMLButtonElement
      ).click(),
    );
    await remount();
    await clock.advance(preferencesSuggestionDelay);
    assert.equal(container.querySelector('.preferences-suggestion'), null);
    localStorage.clear();
    localStorage.setItem(
      'story-typer.preferences.v1',
      JSON.stringify({ language: 'it' }),
    );
    await remount();
    await clock.advance(preferencesSuggestionDelay);
    assert.equal(container.querySelector('.preferences-suggestion'), null);
    localStorage.clear();
    window.history.replaceState(null, '', '/#last-frequency');
    await remount();
    await act(async () =>
      (
        container.querySelector('.overlay > .primary') as HTMLButtonElement
      ).click(),
    );
    await clock.advance(preferencesSuggestionDelay);
    assert.equal(container.querySelector('.preferences-suggestion'), null);
  } finally {
    clock.restore();
  }
});

test('Korean story warns about Hangul and accepts a composed syllable', async () => {
  localStorage.setItem(
    'story-typer.preferences.v1',
    JSON.stringify({ keyboard: 'us', assistance: true, errorMode: 'correct' }),
  );
  window.history.replaceState(null, '', '/#the-rain-button-ko');
  await mount(<App />);
  assert.match(
    container.querySelector('.keyboard-compatibility')!.textContent!,
    /Enable a Korean input method/,
  );
  await act(async () =>
    (
      container.querySelector('.overlay > .primary') as HTMLButtonElement
    ).click(),
  );
  const input = container.querySelector('textarea')!;
  await act(async () => Simulate.compositionStart(input));
  for (const draft of ['ㅈ', '지']) {
    await act(async () => {
      input.value = draft;
      Simulate.change(input);
    });
    assert.equal(container.querySelectorAll('.passage .incorrect').length, 0);
  }
  await act(async () => Simulate.compositionEnd(input));
  assert.equal(input.value, '지');
  assert.equal(container.querySelector('.passage .correct')!.textContent, '지');
});

test('Speed mode allows Korean syllable extension but still blocks corrections', async () => {
  stories.push({
    ...stories[0],
    id: 'korean-speed-test',
    storyId: 'korean-speed-test',
    language: 'ko',
    paragraphs: [{ title: 'Test', time: '00:00', text: '각자 간다' }],
  });
  try {
    localStorage.setItem(
      'story-typer.preferences.v1',
      JSON.stringify({ errorMode: 'forward' }),
    );
    window.history.replaceState(null, '', '/#korean-speed-test');
    await mount(<App />);
    await act(async () =>
      (
        container.querySelector('.overlay > .primary') as HTMLButtonElement
      ).click(),
    );
    const input = container.querySelector('textarea')!;
    for (const text of ['가', '각', '각자']) {
      await act(async () => Simulate.compositionStart(input));
      await act(async () => {
        input.value = text;
        Simulate.compositionEnd(input);
      });
      assert.equal(input.value, text);
    }
    await act(async () => {
      input.value = '각';
      Simulate.change(input);
    });
    assert.equal(input.value, '각자');
    await act(async () => Simulate.compositionStart(input));
    await act(async () => {
      input.value = '각차';
      Simulate.compositionEnd(input);
    });
    assert.equal(input.value, '각자');
  } finally {
    stories.pop();
  }
});

test('a long story supports paragraph transitions, its new animation, pausing and exact completion', async () => {
  localStorage.setItem(
    'story-typer.preferences.v1',
    JSON.stringify({
      siteLanguage: 'en',
      assistance: false,
      errorMode: 'correct',
    }),
  );
  window.history.replaceState(null, '', '/#the-cartographers-winter');
  const story = stories.find(
    (story) => story.id === 'the-cartographers-winter',
  )!;
  await mount(<App />);
  assert.match(
    container.querySelector('.story-nav')!.textContent!,
    /The Cartographer/,
  );
  await act(async () =>
    (
      container.querySelector('.overlay > .primary') as HTMLButtonElement
    ).click(),
  );
  const input = container.querySelector('textarea')!;
  await act(async () => {
    input.value = story.paragraphs[0].text;
    Simulate.change(input);
  });
  await act(async () => Simulate.keyDown(input, { key: 'Enter' }));
  assert.equal(
    container.querySelector('.current-paragraph')!.getAttribute('aria-label'),
    'Paragraph 2',
  );
  await act(async () =>
    (
      container.querySelector(
        '[aria-label="Snow animation"]',
      ) as HTMLButtonElement
    ).click(),
  );
  assert.ok(container.querySelector('.snow-background'));
  await act(async () =>
    (container.querySelector('.pause-control') as HTMLButtonElement).click(),
  );
  assert.ok(container.querySelector('.snow-background.rain-paused'));
  await act(async () =>
    (container.querySelector('.pause-control') as HTMLButtonElement).click(),
  );
  await act(async () => {
    input.value = story.paragraphs.map((part) => part.text).join(' ');
    Simulate.change(input);
  });
  assert.ok(container.querySelector('.results'));
  assert.match(container.querySelector('.results')!.textContent!, /100%/);
});

test('composition drafts are not committed until composition ends', async () => {
  const committed: string[] = [];
  function Harness() {
    const [value, setValue] = useState('');
    const input = useCompositionInput(
      value,
      (next) => {
        const normalized = next.normalize('NFC');
        committed.push(normalized);
        setValue(normalized);
      },
      false,
      'test',
    );
    return <textarea {...input} />;
  }
  await mount(<Harness />);
  const input = container.querySelector('textarea')!;
  await act(async () => Simulate.compositionStart(input));
  await act(async () => {
    input.value = 'e';
    Simulate.change(input);
  });
  assert.deepEqual(committed, []);
  assert.equal(input.value, 'e');
  await act(async () => {
    input.value = 'e\u0301';
    Simulate.compositionEnd(input);
  });
  assert.deepEqual(committed, ['é']);
  assert.equal(input.value, 'é');
});

test('the reader accepts a composed accent and emoji without false errors or lost accuracy', async () => {
  stories.push({
    ...stories[0],
    id: 'unicode-test',
    storyId: 'unicode-test',
    title: 'Unicode test',
    paragraphs: [{ title: 'Test', time: '00:00', text: 'café 😀' }],
  });
  try {
    window.history.replaceState(null, '', '/#unicode-test');
    await mount(<App />);
    await act(async () =>
      (
        container.querySelector('.overlay > .primary') as HTMLButtonElement
      ).click(),
    );
    const input = container.querySelector('textarea')!;
    await act(async () => Simulate.compositionStart(input));
    await act(async () => {
      input.value = 'cafe';
      Simulate.change(input);
    });
    assert.equal(container.querySelector('.incorrect'), null);
    assert.equal(container.querySelectorAll('.correct').length, 0);
    await act(async () => {
      input.value = 'cafe\u0301';
      Simulate.compositionEnd(input);
    });
    assert.equal(input.value, 'café');
    assert.equal(container.querySelectorAll('.correct').length, 4);
    await act(async () => {
      input.value = 'café 😀';
      Simulate.change(input);
    });
    assert.ok(container.querySelector('.results'));
    assert.match(
      container.querySelector('.result-stats')!.textContent!,
      /100%/,
    );
  } finally {
    stories.pop();
  }
});

test('hidden tabs pause the game and require an explicit resume', async () => {
  window.history.replaceState(null, '', '/#last-frequency');
  await mount(<App />);
  await act(async () =>
    (
      container.querySelector('.overlay > .primary') as HTMLButtonElement
    ).click(),
  );
  const input = container.querySelector('textarea')!;
  assert.equal(input.readOnly, false);
  assert.equal(container.querySelector('.text-button'), null);
  await act(async () => {
    hidden = true;
    document.dispatchEvent(new dom.window.Event('visibilitychange'));
  });
  assert.equal(input.readOnly, true);
  assert.match(
    container.querySelector('.pause-control')!.textContent!,
    /Resume/,
  );
  await act(async () => {
    hidden = false;
    localStorage.clear();
    document.dispatchEvent(new dom.window.Event('visibilitychange'));
  });
  assert.equal(input.readOnly, true);
  await act(async () =>
    (container.querySelector('.pause-control') as HTMLButtonElement).click(),
  );
  assert.equal(input.readOnly, false);
  assert.equal(document.activeElement, input);
});

test('tooltip stays dismissed after a click and focus loss; fresh hover can reopen it', async () => {
  let toggles = 0;
  await mount(
    <EffectToggle
      label="Typing sounds"
      icon="keyboard"
      active={false}
      onToggle={() => toggles++}
    />,
  );
  const control = container.querySelector('.effect-control')!;
  const button = container.querySelector('button')!;
  await act(async () => button.click());
  assert.equal(toggles, 1);
  assert.equal(control.getAttribute('data-tooltip-dismissed'), 'true');
  await act(async () => Simulate.blur(button));
  assert.equal(control.getAttribute('data-tooltip-dismissed'), 'true');
  await act(async () =>
    Simulate.pointerEnter(control, { pointerType: 'mouse' }),
  );
  assert.equal(control.getAttribute('data-tooltip-dismissed'), 'false');
  await act(async () => Simulate.keyDown(button, { key: 'Escape' }));
  assert.equal(control.getAttribute('data-tooltip-dismissed'), 'true');
});

test('story progress survives switching to another story and back', async () => {
  window.history.replaceState(null, '', '/#last-frequency');
  await mount(<App />);
  await act(async () =>
    (
      container.querySelector('.overlay > .primary') as HTMLButtonElement
    ).click(),
  );
  await act(async () => {
    const input = container.querySelector('textarea')!;
    input.value = 'Rain';
    Simulate.change(input);
  });
  async function navigate(hash: string) {
    await act(async () => {
      window.history.replaceState(null, '', '/' + hash);
      window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
    });
  }
  await navigate('#one-small-garden');
  assert.ok(container.querySelector('.overlay'));
  await navigate('#last-frequency');
  assert.equal(container.querySelector('textarea')!.value, 'Rain');
  assert.equal(container.querySelector('textarea')!.readOnly, true);
});

test('catalog language filters, empty results, and reset work in the interface', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.filter-button') as HTMLButtonElement).click(),
  );
  const selectFor = (label: string) =>
    [...container.querySelectorAll('.filter-field')]
      .find((item) => item.querySelector('span')?.textContent === label)!
      .querySelector<HTMLButtonElement>('.single-select-trigger')!;
  const storyCount = new Set(
    stories
      .filter((story) => story.language === 'en')
      .map((story) => story.storyId),
  ).size;
  assert.equal(container.querySelectorAll('.story-card').length, storyCount);
  assert.equal(
    container.querySelector('.filter-button span')?.textContent,
    '1',
  );
  await chooseOption(selectFor('Language'), 'it');
  assert.equal(
    container.querySelectorAll('.story-card').length,
    stories.filter((story) => story.language === 'it').length,
  );
  assert.match(
    container.querySelector('.story-card h2')!.textContent!,
    /Un piccolo giardino/,
  );
  await chooseOption(selectFor('Genre'), 'Mystery');
  await act(async () => {
    const search = container.querySelector(
      '.story-search input',
    ) as HTMLInputElement;
    search.value = 'no-such-story-for-filter-test';
    Simulate.change(search);
  });
  assert.equal(container.querySelectorAll('.story-card').length, 0);
  assert.ok(container.querySelector('.library-empty'));
  await act(async () =>
    (
      container.querySelector('.library-empty button') as HTMLButtonElement
    ).click(),
  );
  assert.equal(
    container.querySelectorAll('.story-card').length,
    new Set(stories.map((story) => story.storyId)).size,
  );
  assert.equal(container.querySelector('.filter-button span'), null);
  assert.equal(selectFor('Language').value, 'all');
});

test('catalog filter choice survives opening an Italian edition and returning', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.filter-button') as HTMLButtonElement).click(),
  );
  const languageSelect = () =>
    [...container.querySelectorAll('.filter-field')]
      .find((item) => item.querySelector('span')?.textContent === 'Language')!
      .querySelector<HTMLButtonElement>('.single-select-trigger')!;
  await chooseOption(languageSelect(), 'it');
  await act(async () => {
    window.history.replaceState(null, '', '/#un-piccolo-giardino');
    window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
  });
  assert.equal(container.querySelector('textarea')!.lang, 'it');
  await act(async () => {
    window.history.replaceState(null, '', '/');
    window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
  });
  await act(async () =>
    (container.querySelector('.filter-button') as HTMLButtonElement).click(),
  );
  assert.equal(languageSelect().value, 'it');
  assert.equal(
    container.querySelectorAll('.story-card').length,
    stories.filter((story) => story.language === 'it').length,
  );
});

test('similar letters render yellow and can complete an assisted attempt', async () => {
  stories.push({
    ...stories[0],
    id: 'assisted-test',
    storyId: 'assisted-test',
    paragraphs: [{ title: 'Test', time: '00:00', text: 'dà qui' }],
  });
  try {
    window.history.replaceState(null, '', '/#assisted-test');
    await mount(<App />);
    await act(async () =>
      (
        container.querySelector('.overlay > .primary') as HTMLButtonElement
      ).click(),
    );
    const input = container.querySelector('textarea')!;
    await act(async () => {
      input.value = 'da';
      Simulate.change(input);
    });
    assert.equal(container.querySelectorAll('.assisted').length, 1);
    assert.equal(container.querySelectorAll('.correct').length, 1);
    assert.equal(container.querySelector('.incorrect'), null);
    await act(async () => {
      input.value = 'da qui';
      Simulate.change(input);
    });
    assert.ok(container.querySelector('.results'));
    assert.match(
      container.querySelector('.results-assistance')!.textContent!,
      /1 assisted entries/,
    );
    assert.match(
      container.querySelector('.results-assistance')!.textContent!,
      /83% exact accuracy/,
    );
    assert.match(
      container.querySelector('.result-stats')!.textContent!,
      /100%/,
    );
  } finally {
    stories.pop();
  }
});

test('strict mode rejects base letters but offers the exact accent button', async () => {
  localStorage.setItem(
    'story-typer.preferences.v1',
    JSON.stringify({
      language: 'none',
      assistance: false,
      keyboard: 'us',
      errorMode: 'correct',
    }),
  );
  stories.push({
    ...stories[0],
    id: 'strict-test',
    storyId: 'strict-test',
    paragraphs: [{ title: 'Test', time: '00:00', text: 'dà' }],
  });
  try {
    window.history.replaceState(null, '', '/#strict-test');
    await mount(<App />);
    await act(async () =>
      (
        container.querySelector('.overlay > .primary') as HTMLButtonElement
      ).click(),
    );
    const input = container.querySelector('textarea')!;
    await act(async () => {
      input.value = 'da';
      Simulate.change(input);
    });
    assert.ok(container.querySelector('.incorrect'));
    assert.equal(container.querySelector('.results'), null);
    await act(async () => {
      input.value = 'd';
      Simulate.change(input);
    });
    const accent = container.querySelector(
      '.insert-character',
    ) as HTMLButtonElement;
    assert.ok(accent);
    assert.equal(accent.textContent, 'à');
    await act(async () => accent.click());
    assert.ok(container.querySelector('.results'));
    assert.equal(container.querySelector('.results-assistance'), null);
  } finally {
    stories.pop();
  }
});

test('preferred language is remembered and filters the library immediately', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  await act(async () =>
    (
      container.querySelector('.multi-select-trigger') as HTMLButtonElement
    ).click(),
  );
  await act(async () =>
    (
      [...container.querySelectorAll('.multi-select-option')].find(
        (row) => row.textContent === 'English',
      ) as HTMLButtonElement
    ).click(),
  );
  const preference = [
    ...container.querySelectorAll('.multi-select-option'),
  ].find((label) => label.textContent === 'Italiano')! as HTMLButtonElement;
  await act(async () => {
    preference.click();
  });
  assert.match(container.textContent!, /Un piccolo giardino/);
  assert.equal(
    container.querySelectorAll('.story-card').length,
    new Set(
      stories
        .filter((story) => story.language === 'it')
        .map((story) => story.storyId),
    ).size,
  );
  assert.equal(container.querySelector('.edition-fallback'), null);
  await act(async () => root!.unmount());
  root = undefined;
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  await act(async () =>
    (
      container.querySelector('.multi-select-trigger') as HTMLButtonElement
    ).click(),
  );
  assert.equal(
    [...container.querySelectorAll('.multi-select-option')]
      .find((label) => label.textContent === 'Italiano')!
      .getAttribute('aria-pressed'),
    'true',
  );
  assert.match(container.textContent!, /Un piccolo giardino/);
});

test('site language changes immediately and persists independently of multiple reading languages', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  await act(async () =>
    (
      container.querySelector('.multi-select-trigger') as HTMLButtonElement
    ).click(),
  );
  for (const language of ['English', 'Italiano']) {
    const input = [...container.querySelectorAll('.multi-select-option')].find(
      (label) => label.textContent === language,
    )! as HTMLButtonElement;
    if (input.getAttribute('aria-pressed') === 'false')
      await act(async () => input.click());
  }
  const siteLanguage = container.querySelector(
    '.preferred-language .single-select-trigger',
  ) as HTMLButtonElement;
  await chooseOption(siteLanguage, 'it');
  assert.equal(document.documentElement.lang, 'it');
  assert.equal(
    container.querySelector('#preferences-title')!.textContent,
    'Preferenze',
  );
  assert.match(
    container.querySelector('#library-title')!.textContent!,
    /Trova la tua prossima storia/,
  );
  assert.match(container.textContent!, /One Small Garden/);
  const saved = JSON.parse(localStorage.getItem('story-typer.preferences.v1')!);
  assert.deepEqual(saved.readingLanguages, ['en', 'it']);
  assert.equal(saved.siteLanguage, 'it');
  await act(async () => root!.unmount());
  root = undefined;
  await mount(<App />);
  assert.equal(document.documentElement.lang, 'it');
  assert.match(
    container.querySelector('#library-title')!.textContent!,
    /Trova la tua prossima storia/,
  );
});

test('changing the interface language preserves story text, input and attempt settings', async () => {
  window.history.replaceState(null, '', '/#last-frequency');
  await mount(<App />);
  await act(async () =>
    (
      container.querySelector('.overlay > .primary') as HTMLButtonElement
    ).click(),
  );
  const input = container.querySelector('textarea')!;
  const typed = stories[0].paragraphs[0].text.slice(0, 12);
  await act(async () => {
    input.value = typed;
    Simulate.change(input);
  });
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  const language = container.querySelector(
    '.preferred-language .single-select-trigger',
  ) as HTMLButtonElement;
  await chooseOption(language, 'it');
  await act(async () =>
    (container.querySelector('.dialog-close') as HTMLButtonElement).click(),
  );
  assert.equal(container.querySelector('textarea')!.value, typed);
  assert.equal(container.querySelector('.passage')!.getAttribute('lang'), 'en');
  assert.match(
    container.querySelector('.pause-control')!.textContent!,
    /Riprendi/,
  );
  assert.equal(
    container.querySelector('.settings-trigger')!.getAttribute('aria-label'),
    'Preferenze',
  );
  assert.match(
    container.querySelector('#passage-description')!.textContent!,
    /Rain taps against the window/,
  );
});

test('reading-language multi-select searches, preserves hidden selections, clears and closes with Escape', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  const trigger = container.querySelector(
    '.multi-select-trigger',
  ) as HTMLButtonElement;
  const dialog = container.querySelector('dialog')!;
  dialog.getBoundingClientRect = () =>
    ({
      left: 0,
      right: 560,
      top: 20,
      bottom: 500,
      width: 560,
      height: 480,
    }) as DOMRect;
  trigger.getBoundingClientRect = () =>
    ({
      left: 20,
      right: 540,
      top: 400,
      bottom: 438,
      width: 520,
      height: 38,
    }) as DOMRect;
  await act(async () => trigger.click());
  const search = container.querySelector(
    '.multi-select-search',
  ) as HTMLInputElement;
  assert.equal(document.activeElement, search);
  const panel = container.querySelector('.multi-select-panel') as HTMLElement;
  assert.ok(parseFloat(panel.style.top) >= 20);
  assert.ok(parseFloat(panel.style.top) + parseFloat(panel.style.height) < 400);
  await act(async () =>
    (
      container.querySelector('.multi-select-clear') as HTMLButtonElement
    ).click(),
  );
  const query = async (text: string) =>
    act(async () => {
      search.value = text;
      Simulate.change(search);
    });
  await query('ital');
  assert.equal(container.querySelectorAll('.multi-select-option').length, 1);
  await act(async () =>
    (
      container.querySelector('.multi-select-option') as HTMLButtonElement
    ).click(),
  );
  await query('en');
  await act(async () =>
    (
      container.querySelector('.multi-select-option') as HTMLButtonElement
    ).click(),
  );
  assert.deepEqual(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!)
      .readingLanguages,
    ['it', 'en'],
  );
  await query('no-such-language');
  assert.match(panel.textContent!, /No languages found/);
  await act(async () => {
    search.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  assert.equal(container.querySelector('.multi-select-panel'), null);
  assert.ok(container.querySelector('dialog[open]'));
  assert.equal(document.activeElement, trigger);
  assert.match(trigger.textContent!, /English, Italiano/);
  await act(async () => trigger.click());
  assert.equal(
    (container.querySelector('.multi-select-search') as HTMLInputElement).value,
    '',
  );
  await act(async () =>
    (
      container.querySelector('.multi-select-clear') as HTMLButtonElement
    ).click(),
  );
  assert.deepEqual(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!)
      .readingLanguages,
    [],
  );
  assert.match(trigger.textContent!, /No preference/);
});

test('language option text, full row and checkmark toggle without checkboxes', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  await act(async () =>
    (
      container.querySelector('.multi-select-trigger') as HTMLButtonElement
    ).click(),
  );
  await act(async () =>
    (
      container.querySelector('.multi-select-clear') as HTMLButtonElement
    ).click(),
  );
  const row = [...container.querySelectorAll('.multi-select-option')].find(
    (label) => label.textContent === 'Italiano',
  ) as HTMLButtonElement;
  const search = container.querySelector('.multi-select-search')!;
  assert.equal(container.querySelector('.multi-select-options input'), null);
  // Focus may briefly leave the search field before clicking a row.
  await act(async () => Simulate.blur(search, { relatedTarget: null }));
  assert.ok(container.querySelector('.multi-select-panel'));
  await act(async () => row.querySelector('span')!.click());
  assert.equal(row.getAttribute('aria-pressed'), 'true');
  assert.deepEqual(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!)
      .readingLanguages,
    ['it'],
  );
  await act(async () => row.click());
  assert.equal(row.getAttribute('aria-pressed'), 'false');
  assert.deepEqual(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!)
      .readingLanguages,
    [],
  );
  assert.ok(container.querySelector('.multi-select-panel'));
  // The selection indicator is part of the same button hit area.
  await act(async () =>
    row
      .querySelector('svg')!
      .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })),
  );
  assert.equal(row.getAttribute('aria-pressed'), 'true');
  assert.deepEqual(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!)
      .readingLanguages,
    ['it'],
  );
});

test('reopening dropdowns reveals the selected row within the list and uses generic search copy', async () => {
  const originalRect = window.HTMLElement.prototype.getBoundingClientRect;
  let last = '';
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.classList.contains('select-menu-options'))
      return {
        top: 100,
        bottom: 200,
        height: 100,
        left: 0,
        right: 300,
        width: 300,
      } as DOMRect;
    if (this.getAttribute('data-value') === last)
      return {
        top: 300,
        bottom: 334,
        height: 34,
        left: 0,
        right: 300,
        width: 300,
      } as DOMRect;
    return originalRect.call(this);
  };
  try {
    for (const count of [8, 12]) {
      last = String(count - 1);
      await mount(
        <SingleSelect
          label="Genre"
          value={last}
          onChange={() => {}}
          options={Array.from({ length: count }, (_, index) => ({
            value: String(index),
            label: `Genre ${index}`,
          }))}
        />,
      );
      const trigger = container.querySelector(
        '.single-select-trigger',
      ) as HTMLButtonElement;
      for (let opening = 0; opening < 2; opening++) {
        await act(async () => trigger.click());
        assert.equal(
          (container.querySelector('.select-menu-options') as HTMLElement)
            .scrollTop,
          134,
        );
        assert.equal(
          container
            .querySelector('[aria-selected="true"]')!
            .getAttribute('data-value'),
          last,
        );
        const search = container.querySelector(
          '.single-select-search',
        ) as HTMLInputElement | null;
        if (search) {
          assert.equal(search.placeholder, 'Search…');
          assert.equal(document.activeElement, search);
        } else
          assert.equal(
            document.activeElement?.getAttribute('data-value'),
            last,
          );
        await act(async () =>
          Simulate.keyDown(document.activeElement!, { key: 'Escape' }),
        );
        assert.equal(container.querySelector('.select-menu-panel'), null);
      }
      await act(async () => root!.unmount());
      root = undefined;
    }
  } finally {
    window.HTMLElement.prototype.getBoundingClientRect = originalRect;
  }
});

test('single-select supports full-row selection, arrow keys, typeahead, focus restoration and Escape', async () => {
  function Harness() {
    const [value, setValue] = useState('a');
    return (
      <SingleSelect
        label="Choice"
        value={value}
        onChange={setValue}
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
          { value: 'c', label: 'Gamma' },
        ]}
      />
    );
  }
  await mount(<Harness />);
  const trigger = container.querySelector(
    '.single-select-trigger',
  ) as HTMLButtonElement;
  await act(async () => Simulate.keyDown(trigger, { key: 'ArrowDown' }));
  assert.equal(document.activeElement?.textContent, 'Alpha');
  await act(async () =>
    Simulate.keyDown(document.activeElement!, { key: 'End' }),
  );
  assert.equal(document.activeElement?.textContent, 'Gamma');
  await act(async () =>
    Simulate.keyDown(document.activeElement!, { key: 'ArrowUp' }),
  );
  assert.equal(document.activeElement?.textContent, 'Beta');
  await act(async () =>
    Simulate.keyDown(document.activeElement!, { key: 'Home' }),
  );
  assert.equal(document.activeElement?.textContent, 'Alpha');
  await act(async () =>
    Simulate.keyDown(document.activeElement!, { key: 'g' }),
  );
  assert.equal(document.activeElement?.textContent, 'Gamma');
  await act(async () =>
    (document.activeElement as HTMLElement).querySelector('span')!.click(),
  );
  assert.equal(trigger.value, 'c');
  assert.equal(container.querySelector('[role="listbox"]'), null);
  assert.equal(document.activeElement, trigger);
  await act(async () => trigger.click());
  assert.equal(document.activeElement?.getAttribute('aria-selected'), 'true');
  await act(async () =>
    Simulate.keyDown(document.activeElement!, { key: 'Escape' }),
  );
  assert.equal(trigger.value, 'c');
  assert.equal(document.activeElement, trigger);
  assert.equal(container.querySelector('[role="listbox"]'), null);
});

test('keyboard suggestions are not saved until explicitly confirmed', async () => {
  Object.defineProperty(navigator, 'keyboard', {
    configurable: true,
    value: { getLayoutMap: async () => new Map([['Semicolon', 'ò']]) },
  });
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  assert.match(
    container.querySelector('.keyboard-confirmation')!.textContent!,
    /Italian QWERTY/,
  );
  assert.equal(localStorage.getItem('story-typer.preferences.v1'), null);
  const confirm = container.querySelector(
    '.confirm-layout',
  ) as HTMLButtonElement;
  await act(async () => confirm.click());
  assert.equal(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!).keyboard,
    'italian',
  );
});

test('preferences open from the header, pause reading, and Escape returns focus without resuming', async () => {
  window.history.replaceState(null, '', '/#last-frequency');
  await mount(<App />);
  await act(async () =>
    (
      container.querySelector('.overlay > .primary') as HTMLButtonElement
    ).click(),
  );
  const trigger = container.querySelector(
    '.settings-trigger',
  ) as HTMLButtonElement;
  await act(async () => trigger.click());
  assert.ok(container.querySelector('dialog[open]'));
  assert.equal(container.querySelector('textarea')!.readOnly, true);
  assert.equal(container.querySelectorAll('.typing-preferences').length, 1);
  await act(async () =>
    Simulate.keyDown(container.querySelector('.dialog-close')!, {
      key: 'Escape',
    }),
  );
  assert.equal(container.querySelector('dialog'), null);
  assert.equal(document.activeElement, trigger);
  assert.equal(container.querySelector('textarea')!.readOnly, true);
});

test('the preferences backdrop closes the popup and restores page scrolling', async () => {
  await mount(<App />);
  assert.equal(container.querySelector('.preferred-language'), null);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  assert.equal(document.body.style.overflow, 'hidden');
  await act(async () =>
    (container.querySelector('dialog') as HTMLDialogElement).click(),
  );
  assert.equal(container.querySelector('dialog'), null);
  assert.equal(document.body.style.overflow, '');
});

test('the assistance switch saves immediately without a Done button', async () => {
  await mount(<App />);
  const trigger = container.querySelector(
    '.settings-trigger',
  ) as HTMLButtonElement;
  await act(async () => trigger.click());
  const toggle = container.querySelector('[role="switch"]') as HTMLInputElement;
  assert.equal(toggle.checked, true);
  await act(async () => toggle.click());
  assert.equal(toggle.checked, false);
  assert.equal(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!).assistance,
    false,
  );
  assert.equal(
    [...container.querySelectorAll('button')].some(
      (button) => button.textContent === 'Done',
    ),
    false,
  );
  await act(async () =>
    (container.querySelector('.dialog-close') as HTMLButtonElement).click(),
  );
  assert.equal(container.querySelector('dialog'), null);
  assert.equal(document.activeElement, trigger);
});

test('manual keyboard selection takes priority over an unfinished automatic check', async () => {
  let resolve!: (value: Map<string, string>) => void;
  Object.defineProperty(navigator, 'keyboard', {
    configurable: true,
    value: {
      getLayoutMap: () =>
        new Promise<Map<string, string>>((done) => {
          resolve = done;
        }),
    },
  });
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  const select = container.querySelector(
    '.keyboard-controls .single-select-trigger',
  ) as HTMLButtonElement;
  await chooseOption(select, 'us');
  await act(async () => resolve(new Map([['Semicolon', 'ò']])));
  assert.equal(select.value, 'us');
  assert.equal(container.querySelector('.keyboard-confirmation'), null);
  assert.equal(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!).keyboard,
    'us',
  );
});

test('a saved layout is not checked again until the Detect button is clicked', async () => {
  localStorage.setItem(
    'story-typer.preferences.v1',
    JSON.stringify({ language: 'none', assistance: true, keyboard: 'us' }),
  );
  let calls = 0;
  Object.defineProperty(navigator, 'keyboard', {
    configurable: true,
    value: {
      getLayoutMap: async () => {
        calls++;
        return new Map([['Semicolon', 'ò']]);
      },
    },
  });
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  assert.equal(calls, 0);
  await act(async () => {
    (container.querySelector('.detect-keyboard') as HTMLButtonElement).click();
  });
  assert.equal(calls, 1);
  assert.ok(container.querySelector('.keyboard-confirmation'));
  assert.equal(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!).keyboard,
    'us',
  );
});

test('rejecting a detected layout restores the dropdown without saving it', async () => {
  Object.defineProperty(navigator, 'keyboard', {
    configurable: true,
    value: { getLayoutMap: async () => new Map([['Semicolon', 'ò']]) },
  });
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  assert.equal(
    container.querySelector('.keyboard-controls .single-select-trigger'),
    null,
  );
  await act(async () =>
    (container.querySelector('.dismiss-layout') as HTMLButtonElement).click(),
  );
  const select = container.querySelector(
    '.keyboard-controls .single-select-trigger',
  ) as HTMLButtonElement;
  assert.equal(select.value, 'unknown');
  assert.equal(document.activeElement, select);
  assert.equal(localStorage.getItem('story-typer.preferences.v1'), null);
});

test('Free flow allows backspace and completes with uncorrected errors', async () => {
  stories.push({
    ...stories[0],
    id: 'free-test',
    storyId: 'free-test',
    paragraphs: [{ title: 'Test', time: '00:00', text: 'ab cd' }],
  });
  try {
    window.history.replaceState(null, '', '/#free-test');
    await mount(<App />);
    await act(async () =>
      (
        container.querySelector('.overlay > .primary') as HTMLButtonElement
      ).click(),
    );
    const input = container.querySelector('textarea')!;
    await act(async () => {
      input.value = 'ax';
      Simulate.change(input);
    });
    assert.ok(container.querySelector('.incorrect'));
    await act(async () => {
      input.value = 'a';
      Simulate.change(input);
    });
    assert.equal(input.value, 'a');
    await act(async () => {
      input.value = 'ax cd';
      Simulate.change(input);
    });
    assert.ok(container.querySelector('.results'));
    assert.equal(
      container.querySelector('.results-mode')!.textContent,
      'Free flow',
    );
  } finally {
    stories.pop();
  }
});

test('Keep moving rejects corrections, records errors, and keeps its mode after preference changes', async () => {
  localStorage.setItem(
    'story-typer.preferences.v1',
    JSON.stringify({ errorMode: 'forward', assistance: true }),
  );
  stories.push({
    ...stories[0],
    id: 'forward-test',
    storyId: 'forward-test',
    paragraphs: [{ title: 'Test', time: '00:00', text: 'ab cd' }],
  });
  try {
    window.history.replaceState(null, '', '/#forward-test');
    await mount(<App />);
    await act(async () =>
      (
        container.querySelector('.overlay > .primary') as HTMLButtonElement
      ).click(),
    );
    const input = container.querySelector('textarea')!;
    await act(async () => {
      input.value = 'ax';
      Simulate.change(input);
    });
    const backspace = new dom.window.KeyboardEvent('keydown', {
      key: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    await act(async () => {
      input.dispatchEvent(backspace);
    });
    assert.equal(backspace.defaultPrevented, true);
    await act(async () => {
      input.value = 'a';
      Simulate.change(input);
    });
    assert.equal(input.value, 'ax');
    await act(async () =>
      (
        container.querySelector('.settings-trigger') as HTMLButtonElement
      ).click(),
    );
    await chooseOption(
      container.querySelector(
        '.error-mode-options .single-select-trigger',
      ) as HTMLButtonElement,
      'free',
    );
    await act(async () =>
      (container.querySelector('.dialog-close') as HTMLButtonElement).click(),
    );
    await act(async () =>
      (container.querySelector('.pause-control') as HTMLButtonElement).click(),
    );
    await act(async () => {
      input.value = 'a';
      Simulate.change(input);
    });
    assert.equal(input.value, 'ax');
    await act(async () => {
      input.value = 'ax cd';
      Simulate.change(input);
    });
    assert.equal(
      container.querySelector('.results-mode')!.textContent,
      'Keep moving',
    );
    assert.match(container.querySelector('.result-stats')!.textContent!, /80%/);
  } finally {
    stories.pop();
  }
});

test('uncorrected emoji errors do not shift paragraph transitions or Enter handling', async () => {
  stories.push({
    ...stories[0],
    id: 'alignment-test',
    storyId: 'alignment-test',
    paragraphs: [
      { title: 'First', time: '00:00', text: 'ab' },
      { title: 'Second', time: '00:01', text: 'cd' },
    ],
  });
  try {
    window.history.replaceState(null, '', '/#alignment-test');
    await mount(<App />);
    await act(async () =>
      (
        container.querySelector('.overlay > .primary') as HTMLButtonElement
      ).click(),
    );
    const input = container.querySelector('textarea')!;
    await act(async () => {
      input.value = '😀x';
      Simulate.change(input);
    });
    await act(async () => Simulate.keyDown(input, { key: 'Enter' }));
    assert.equal(input.value, '😀x ');
    assert.equal(
      container
        .querySelector('[aria-current="step"]')!
        .getAttribute('aria-label'),
      'Paragraph 2',
    );
    await act(async () => {
      input.value = '😀x cd';
      Simulate.change(input);
    });
    assert.ok(container.querySelector('.results'));
    assert.match(container.querySelector('.result-stats')!.textContent!, /60%/);
  } finally {
    stories.pop();
  }
});

test('all error modes explain their behavior before selection', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  const select = container.querySelector(
    '.error-mode-options .single-select-trigger',
  ) as HTMLButtonElement;
  await act(async () => select.click());
  const choices = [...container.querySelectorAll('[role="option"]')];
  assert.equal(choices.length, 3);
  assert.match(choices[0].textContent!, /Story/);
  assert.match(choices[0].textContent!, /corrections optional/);
  assert.match(choices[1].textContent!, /Accuracy/);
  assert.match(choices[1].textContent!, /fix errors to continue/);
  assert.match(choices[2].textContent!, /Speed/);
  assert.match(choices[2].textContent!, /corrections disabled/);
  if (container.querySelector('[role="listbox"]'))
    await act(async () => select.click());
  const info = container.querySelector(
    '[aria-label="About typing settings"]',
  ) as HTMLButtonElement;
  await act(async () => info.click());
  assert.match(
    container.querySelector('[role="tooltip"]')!.textContent!,
    /Speed: no backtracking/,
  );
  assert.equal(select.value, 'free');
  await act(async () => Simulate.keyDown(info, { key: 'Escape' }));
  assert.equal(container.querySelector('[role="tooltip"]'), null);
  assert.ok(container.querySelector('dialog'));
  await chooseOption(select, 'correct');
  assert.equal(
    JSON.parse(localStorage.getItem('story-typer.preferences.v1')!).errorMode,
    'correct',
  );
});

test('info tooltips are positioned above their trigger and stay inside the modal bounds', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  const info = container.querySelector(
    '[aria-label="About typing settings"]',
  ) as HTMLButtonElement;
  const bounds = (
    left: number,
    top: number,
    width: number,
    height: number,
  ) => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  });
  container.querySelector('dialog')!.getBoundingClientRect = () =>
    bounds(100, 100, 640, 450);
  info.parentElement!.getBoundingClientRect = () => bounds(690, 400, 18, 18);
  await act(async () => info.click());
  const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
  assert.ok(parseFloat(tooltip.style.top) < 400);
  assert.ok(parseFloat(tooltip.style.left) >= 112);
  assert.ok(
    parseFloat(tooltip.style.left) + parseFloat(tooltip.style.width) <= 728,
  );
  assert.equal(container.querySelectorAll('dialog').length, 1);
});

test('story edition buttons update the card and remember the choice', async () => {
  localStorage.setItem(
    'story-typer.preferences.v1',
    JSON.stringify({ readingLanguages: ['en', 'it'] }),
  );
  await mount(<App />);
  const group = container
    .querySelector('[aria-label="Your languages"]')!
    .closest('article')!;
  assert.ok(group);
  const preferred = group.querySelector('[aria-label="Your languages"]')!;
  const other = group.querySelector(
    '[aria-label="Other available languages"]',
  )!;
  assert.deepEqual(
    [...preferred.querySelectorAll('button')].map((button) => button.lang),
    ['en', 'it'],
  );
  assert.deepEqual(
    [...other.querySelectorAll('button')].map((button) => button.lang),
    ['fr'],
  );
  const italian = [...group.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.lang === 'it',
  )!;
  await act(async () => italian.click());
  const card = italian.closest('article')!;
  assert.equal(card.querySelector('h2')?.textContent, 'Un piccolo giardino');
  assert.equal(
    card.querySelector('a.primary')?.getAttribute('href'),
    '#un-piccolo-giardino',
  );
  assert.equal(italian.getAttribute('aria-pressed'), 'true');
  assert.ok(italian.closest('.tags'));
  assert.ok(
    card.querySelector('.primary')!.compareDocumentPosition(other) &
      dom.window.Node.DOCUMENT_POSITION_FOLLOWING,
  );
  assert.equal(window.location.hash, '');
  await act(async () => root!.unmount());
  root = undefined;
  await mount(<App />);
  const restored = container
    .querySelector('[aria-label="Your languages"]')!
    .closest('article')!;
  assert.equal(
    restored.querySelector('[aria-pressed="true"]')?.getAttribute('lang'),
    'it',
  );
});
