import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Run the real transport hook without a browser or an additional test package.
// Images remain deferred, so either artwork or outgoing motion can finish first.
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const hookSource = compile('../src/hooks/useCassetteTransport.ts');
const motionModule = { exports: {} };
runInNewContext(compile('../src/config/cassetteMotion.ts'), { exports: motionModule.exports });
const settle = () => new Promise(resolve => setImmediate(resolve));

function createTransport(reducedMotion = false) {
  const slots = [];
  const effects = [];
  const images = [];
  const sounds = [];
  const idleCallbacks = new Map();
  let cursor = 0;
  let mounted = true;
  let writesAfterUnmount = 0;

  class DeferredImage {
    constructor() {
      this.onload = null;
      this.onerror = null;
      this.loaded = false;
      this.finished = false;
      this.decodingPromise = new Promise((resolve, reject) => {
        this.resolveDecode = resolve;
        this.rejectDecode = reject;
      });
      images.push(this);
    }
    decode() { return this.decodingPromise; }
    load() {
      if (this.finished || this.loaded) return;
      this.loaded = true;
      this.onload?.();
    }
    finish() {
      if (this.finished) return;
      this.load();
      this.finished = true;
      this.resolveDecode();
    }
    fail() {
      if (this.finished) return;
      // Decoding can still fail after the image's load event has fired.
      this.load();
      this.finished = true;
      this.rejectDecode(new Error(`Unable to decode ${this.src}`));
    }
  }

  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, value => {
        if (!mounted) writesAfterUnmount++;
        slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useCallback(callback) { return callback; },
    useEffect(effect) {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = {};
        effects.push(() => { slots[index].cleanup = effect(); });
      }
    },
  };
  const mixtapes = ['a', 'b'].map(id => ({
    id,
    artwork: { label: `${id}/label.png` },
    hardware: { reel: `${id}/reel.svg`, guideRoller: `${id}/roller.svg` },
  }));
  const exports = {};
  runInNewContext(hookSource, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name.endsWith('/mixtapes')) return { MIXTAPES: mixtapes, resolveAsset: path => `/${path}` };
      if (name.endsWith('/cassetteMotion')) return motionModule.exports;
      if (name.endsWith('/mechanicalAudio')) return { playMechanicalSound: (...args) => sounds.push(args) };
      throw new Error(`Unexpected transport dependency: ${name}`);
    },
    Image: DeferredImage,
    window: {
      requestIdleCallback(callback) {
        const id = idleCallbacks.size + 1;
        idleCallbacks.set(id, callback);
        return id;
      },
      cancelIdleCallback(id) { idleCallbacks.delete(id); },
    },
    setTimeout,
    clearTimeout,
  });

  const render = () => {
    cursor = 0;
    const transport = exports.useCassetteTransport(reducedMotion);
    effects.splice(0).forEach(effect => effect());
    return transport;
  };
  render();
  return {
    get value() { return render(); },
    images,
    sounds,
    async finishImages() { images.forEach(image => image.finish()); await settle(); },
    async failImages() { images.forEach(image => image.fail()); await settle(); },
    unmount() {
      slots.forEach(slot => slot?.cleanup?.());
      mounted = false;
    },
    get writesAfterUnmount() { return writesAfterUnmount; },
    get idleCount() { return idleCallbacks.size; },
  };
}

function expectState(harness, state, selectedId) {
  assert.equal(harness.value.state, state);
  assert.equal(harness.value.selectedId, selectedId);
  assert.equal(harness.value.busy, ['loading', 'inserting', 'ejecting', 'reinserting', 'removing'].includes(state));
}

async function seat(harness, id = 'a') {
  harness.value.select(id);
  await harness.finishImages();
  expectState(harness, 'inserting', id);
  harness.value.completeMotion('inserting', id);
  expectState(harness, 'ready', id);
}

function raise(harness, id = 'a') {
  harness.value.eject();
  expectState(harness, 'ejecting', id);
  harness.value.completeMotion('ejecting', id);
  expectState(harness, 'ejected', id);
}

test('EJECT retains the raised cassette and it can be seated repeatedly', async () => {
  const harness = createTransport();
  await seat(harness);
  const decodedImageCount = harness.images.length;
  for (let cycle = 0; cycle < 3; cycle++) {
    raise(harness);
    harness.value.reinsert();
    expectState(harness, 'reinserting', 'a');
    harness.value.completeMotion('reinserting', 'a');
    expectState(harness, 'ready', 'a');
  }
  assert.equal(harness.images.length, decodedImageCount, 'reusing a raised tape must not reload its art');
});

test('removal is available for a raised cassette and clears it only after motion', async () => {
  const harness = createTransport();
  await seat(harness);
  harness.value.remove();
  expectState(harness, 'ready', 'a');
  raise(harness);
  harness.value.remove();
  expectState(harness, 'removing', 'a');
  harness.value.completeMotion('ejecting', 'a');
  expectState(harness, 'removing', 'a');
  harness.value.completeMotion('removing', 'a');
  expectState(harness, 'empty', null);
});

test('selecting the same raised cassette reinserts it', async () => {
  const harness = createTransport();
  await seat(harness);
  raise(harness);
  harness.value.select('a');
  expectState(harness, 'reinserting', 'a');
  harness.value.completeMotion('reinserting', 'a');
  expectState(harness, 'ready', 'a');
});

for (const raised of [false, true]) {
  test(`changing a ${raised ? 'raised' : 'seated'} cassette waits for outgoing motion when artwork finishes first`, async () => {
    const harness = createTransport();
    await seat(harness);
    if (raised) raise(harness);
    harness.value.select('b');
    expectState(harness, 'removing', 'a');
    await harness.finishImages();
    expectState(harness, 'removing', 'a');
    harness.value.completeMotion('removing', 'a');
    expectState(harness, 'inserting', 'b');
    harness.value.completeMotion('inserting', 'a');
    expectState(harness, 'inserting', 'b');
    harness.value.completeMotion('inserting', 'b');
    expectState(harness, 'ready', 'b');
  });
}

test('changing cassette waits for decoding when outgoing motion finishes first', async () => {
  const harness = createTransport();
  await seat(harness);
  harness.value.select('b');
  harness.value.completeMotion('removing', 'a');
  expectState(harness, 'loading', null);
  await harness.finishImages();
  expectState(harness, 'inserting', 'b');
  harness.value.completeMotion('inserting', 'b');
  expectState(harness, 'ready', 'b');
});

test('rapid duplicate gestures and callbacks cannot skip motion phases', async () => {
  const harness = createTransport();
  harness.value.select('a');
  harness.value.select('b');
  expectState(harness, 'loading', null);
  await harness.finishImages();
  harness.value.eject();
  harness.value.remove();
  harness.value.reinsert();
  harness.value.completeMotion('inserting', 'b');
  expectState(harness, 'inserting', 'a');
  harness.value.completeMotion('inserting', 'a');
  harness.value.eject();
  const soundCount = harness.sounds.length;
  harness.value.eject();
  harness.value.reinsert();
  harness.value.remove();
  harness.value.select('b');
  assert.equal(harness.sounds.length, soundCount, 'ignored gestures must not retrigger mechanical sound');
  expectState(harness, 'ejecting', 'a');
  harness.value.completeMotion('inserting', 'a');
  expectState(harness, 'ejecting', 'a');
  harness.value.completeMotion('ejecting', 'a');
  harness.value.reinsert();
  harness.value.completeMotion('ejecting', 'a');
  expectState(harness, 'reinserting', 'a');
  harness.value.completeMotion('reinserting', 'a');
  expectState(harness, 'ready', 'a');
});

for (const failureFirst of [true, false]) {
  test(`failed incoming art stays recoverable when ${failureFirst ? 'decoding' : 'removal'} finishes first`, async () => {
    const harness = createTransport();
    await seat(harness);
    harness.value.select('b');
    if (failureFirst) {
      await harness.failImages();
      expectState(harness, 'removing', 'a');
      harness.value.completeMotion('removing', 'a');
    } else {
      harness.value.completeMotion('removing', 'a');
      await harness.failImages();
    }
    expectState(harness, 'empty', null);
    assert.ok(harness.value.error, 'failed image load must explain that selection can be retried');
    harness.value.select('b');
    assert.equal(harness.value.error, '');
    await harness.finishImages();
    expectState(harness, 'inserting', 'b');
    harness.value.completeMotion('inserting', 'b');
    expectState(harness, 'ready', 'b');
  });
}

test('unmount cancels idle preloading and ignores a later decode completion', async () => {
  const harness = createTransport();
  harness.value.select('a');
  harness.images.forEach(image => image.load());
  harness.unmount();
  assert.equal(harness.idleCount, 0);
  await harness.finishImages();
  assert.equal(harness.writesAfterUnmount, 0);
});

test('reduced motion uses the same eject, reinsert, and removal lifecycle', async () => {
  const harness = createTransport(true);
  await seat(harness);
  raise(harness);
  harness.value.reinsert();
  expectState(harness, 'reinserting', 'a');
  harness.value.completeMotion('reinserting', 'a');
  raise(harness);
  harness.value.remove();
  expectState(harness, 'removing', 'a');
  harness.value.completeMotion('removing', 'a');
  expectState(harness, 'empty', null);
});
