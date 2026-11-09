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
const { stories } = await import('../src/stories');
const container = document.getElementById('root')!;
let root: ReturnType<typeof createRoot> | undefined;
async function mount(content: React.ReactNode) {
  root = createRoot(container);
  await act(async () => root!.render(content));
}
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  hidden = false;
  localStorage.clear();
  Reflect.deleteProperty(navigator, 'keyboard');
  window.history.replaceState(null, '', '/');
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
    [...container.querySelectorAll('label')]
      .find((item) => item.querySelector('span')?.textContent === label)!
      .querySelector('select')!;
  const storyCount = new Set(stories.map((story) => story.storyId)).size;
  assert.equal(container.querySelectorAll('.story-card').length, storyCount);
  await act(async () => {
    const select = selectFor('Language');
    select.value = 'it';
    Simulate.change(select);
  });
  assert.equal(container.querySelectorAll('.story-card').length, 1);
  assert.match(
    container.querySelector('.story-card h2')!.textContent!,
    /Un piccolo giardino/,
  );
  await act(async () => {
    const select = selectFor('Genre');
    select.value = 'Mystery';
    Simulate.change(select);
  });
  assert.equal(container.querySelectorAll('.story-card').length, 0);
  assert.ok(container.querySelector('.library-empty'));
  await act(async () =>
    (
      container.querySelector('.library-empty button') as HTMLButtonElement
    ).click(),
  );
  assert.equal(container.querySelectorAll('.story-card').length, storyCount);
  assert.equal(selectFor('Language').value, 'all');
});

test('catalog filter choice survives opening an Italian edition and returning', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.filter-button') as HTMLButtonElement).click(),
  );
  const languageSelect = () =>
    [...container.querySelectorAll('label')]
      .find((item) => item.querySelector('span')?.textContent === 'Language')!
      .querySelector('select')!;
  await act(async () => {
    languageSelect().value = 'it';
    Simulate.change(languageSelect());
  });
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
  assert.equal(container.querySelectorAll('.story-card').length, 1);
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

test('preferred language is remembered across mounts without hiding fallback editions', async () => {
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  const preference = container.querySelector(
    '.preferred-language select',
  ) as HTMLSelectElement;
  await act(async () => {
    preference.value = 'it';
    Simulate.change(preference);
  });
  assert.match(container.textContent!, /Un piccolo giardino/);
  assert.equal(
    container.querySelectorAll('.story-card').length,
    new Set(stories.map((story) => story.storyId)).size,
  );
  assert.ok(container.querySelector('.edition-fallback'));
  await act(async () => root!.unmount());
  root = undefined;
  await mount(<App />);
  await act(async () =>
    (container.querySelector('.settings-trigger') as HTMLButtonElement).click(),
  );
  assert.equal(
    (container.querySelector('.preferred-language select') as HTMLSelectElement)
      .value,
    'it',
  );
  assert.match(container.textContent!, /Un piccolo giardino/);
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
    '.keyboard-controls select',
  ) as HTMLSelectElement;
  await act(async () => {
    select.value = 'us';
    Simulate.change(select);
  });
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
  assert.equal(container.querySelector('.keyboard-controls select'), null);
  await act(async () =>
    (container.querySelector('.dismiss-layout') as HTMLButtonElement).click(),
  );
  const select = container.querySelector(
    '.keyboard-controls select',
  ) as HTMLSelectElement;
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
    await act(async () => {
      const mode = container.querySelector(
        '.error-mode-options select',
      ) as HTMLSelectElement;
      mode.value = 'free';
      Simulate.change(mode);
    });
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
    '.error-mode-options select',
  ) as HTMLSelectElement;
  const choices = [...select.options];
  assert.equal(choices.length, 3);
  assert.match(choices[0].textContent!, /Story/);
  assert.match(choices[0].textContent!, /corrections optional/);
  assert.match(choices[1].textContent!, /Accuracy/);
  assert.match(choices[1].textContent!, /fix errors to continue/);
  assert.match(choices[2].textContent!, /Speed/);
  assert.match(choices[2].textContent!, /corrections disabled/);
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
  await act(async () => {
    select.value = 'correct';
    Simulate.change(select);
  });
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
