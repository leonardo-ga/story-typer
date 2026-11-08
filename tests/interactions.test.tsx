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
  window.history.replaceState(null, '', '/');
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
    title: 'Unicode test',
    paragraphs: [{ title: 'Test', time: '00:00', text: 'café 😀' }],
  });
  try {
    window.history.replaceState(null, '', '/#unicode-test');
    await mount(<App />);
    await act(async () =>
      (container.querySelector('.overlay button') as HTMLButtonElement).click(),
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
    (container.querySelector('.overlay button') as HTMLButtonElement).click(),
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
    (container.querySelector('.overlay button') as HTMLButtonElement).click(),
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
