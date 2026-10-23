import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const config = {};
runInNewContext(compile('../src/config/cassetteMotion.ts'), { exports: config });

// Exercise the real component handlers and lifecycle with deferred animation
// controls. Browser rendering remains a separate, manual verification step.
function hooks() {
  let cursor = 0;
  const slots = [];
  const effects = [];
  const ref = initial => {
    const index = cursor++;
    slots[index] ??= { current: initial };
    return slots[index];
  };
  return {
    begin() { cursor = 0; },
    flush() { effects.splice(0).forEach(effect => effect()); },
    ref,
    react: {
      useRef: ref,
      useState(initial) {
        const value = ref(typeof initial === 'function' ? initial() : initial);
        return [value.current, next => { value.current = typeof next === 'function' ? next(value.current) : next; }];
      },
      useMemo: callback => callback(),
      useCallback: callback => callback,
      useEffect(effect, deps) {
        const slot = ref(null);
        if (slot.current && deps.every((value, index) => Object.is(value, slot.current.deps[index]))) return;
        effects.push(() => {
          slot.current?.cleanup?.();
          slot.current = { deps, cleanup: effect() };
        });
      },
    },
  };
}

function component(source, imports, globals = {}) {
  const exports = {};
  runInNewContext(compile(source), {
    exports,
    require(name) {
      if (name === 'react/jsx-runtime') return require(name);
      if (name in imports) return imports[name];
      throw new Error(`Unexpected component dependency: ${name}`);
    },
    ...globals,
  });
  return exports;
}

function cassette() {
  const lifecycle = hooks();
  const values = [];
  const animations = [];
  const calls = { remove: [], reinsert: 0, complete: [] };
  const { CassetteObject } = component('../src/components/CassetteObject.tsx', {
    react: lifecycle.react,
    'motion/react': {
      motion: { div: 'motion.div', button: 'motion.button' },
      useMotionValue(initial) {
        const value = lifecycle.ref(null);
        if (!value.current) {
          value.current = { value: initial, get() { return this.value; }, set(next) { this.value = next; }, stop() {} };
          values.push(value.current);
        }
        return value.current;
      },
      animate(value, target, transition) {
        const animation = { from: value.get(), target, transition, stop() {} };
        animations.push(animation);
        return animation;
      },
    },
    '../config/cassetteMotion': config,
    './PhysicalCassette': { PhysicalCassette: 'physical-cassette' },
  }, { window: { innerWidth: 390, innerHeight: 844 } });
  const render = (state = 'ejected') => {
    lifecycle.begin();
    const node = CassetteObject({
      mix: { id: 'a', title: 'Tape' }, state, reducedMotion: false, motionSpeed: 'normal',
      onRemove: throwing => calls.remove.push(throwing), onReinsert: () => calls.reinsert++,
      onMotionComplete: (...args) => calls.complete.push(args),
    });
    lifecycle.flush();
    return { outer: node.props, button: node.props.children.props };
  };
  return { render, values, animations, calls };
}

const click = detail => ({ detail, stopPropagation() {} });
const info = (x, y) => ({ offset: { x, y }, velocity: { x: 0, y: 0 } });

test('a short drag returns without becoming a reinsertion click', () => {
  const h = cassette();
  const { button } = h.render();
  button.onPointerDown({ isPrimary: true });
  button.onDragStart();
  button.onDragEnd({ type: 'pointerup' }, info(20, 0));
  button.onClick(click(1));
  assert.equal(h.calls.reinsert, 0);
  assert.equal(h.calls.remove.length, 0);
  assert.ok(h.animations.every(animation => animation.target === 0));
});

test('INSERT after a drag seats the hand offset smoothly and finishes aligned', () => {
  const h = cassette();
  const { button } = h.render();
  h.values[0].set(18);
  h.values[1].set(-12);
  button.onDragStart();
  button.onClick(click(0)); // Keyboard activation after an abandoned drag.
  assert.equal(h.calls.reinsert, 1);
  assert.equal(h.values[0].get(), 18, 'avoid snapping the tape before seating');
  const { outer } = h.render('reinserting');
  assert.equal(h.animations[0].from, 18);
  assert.ok(h.animations.every(animation => animation.target === 0));
  outer.onAnimationComplete('reinserting');
  assert.deepEqual(h.values.map(value => value.get()), [0, 0]);
});

test('cancelling a primary pointer never throws a tape', () => {
  const h = cassette();
  const { button } = h.render();
  button.onDragStart();
  button.onPointerCancel({ isPrimary: true });
  button.onDragEnd({ type: 'pointercancel' }, info(100, 0));
  button.onClick(click(1));
  assert.equal(h.calls.remove.length, 0);
  assert.equal(h.calls.reinsert, 0);
});

for (const [x, y] of [[-100, 0], [100, 0], [0, -100]]) {
  test(`a throw continues toward ${x},${y} and completes removal`, () => {
    const h = cassette();
    const { button } = h.render();
    button.onDragStart();
    button.onDragEnd({ type: 'pointerup' }, info(x, y));
    assert.deepEqual(h.calls.remove, [true]);
    const { outer } = h.render('removing');
    assert.equal(Math.sign(h.animations[0].target), Math.sign(x));
    assert.equal(Math.sign(h.animations[1].target), Math.sign(y));
    outer.onAnimationComplete('removing');
    assert.deepEqual(h.calls.complete, [['removing', 'a']]);
  });
}

test('releasing a drag outside the tape is not an outside press', () => {
  const lifecycle = hooks();
  let removals = 0;
  class Surface {
    constructor(tape = false) { this.tape = tape; }
    closest(selector) { return this.tape && selector.includes('[data-cassette-object]') ? this : null; }
  }
  const { default: App } = component('../src/App.tsx', {
    react: lifecycle.react,
    './data/mixtapes': { MIXTAPES: [], findSongs: () => [], resolveAudio: value => value },
    './components/Library': { Library: 'library' },
    './components/PlayerScreen': { PlayerScreen: 'player-screen' },
    './hooks/useCassetteTransport': { useCassetteTransport: () => ({ state: 'ejected', busy: false, selectedId: null, remove: () => removals++ }) },
    './hooks/useAudioEngine': { useAudioEngine: () => ({ pause() {}, rewind() {} }) },
    './hooks/useReducedMotion': { useReducedMotion: () => false },
    './utils/mechanicalAudio': { prepareMechanicalAudio() {}, playMechanicalSound() {} },
    './utils/motionSpeed': { readMotionSpeed: () => 'normal', saveMotionSpeed() {} },
    './config/cassetteMotion': config,
  }, { Element: Surface, window: { matchMedia: () => ({ matches: false }) } });
  lifecycle.begin();
  const root = App().props;
  const outside = new Surface();
  root.onPointerDownCapture({ isPrimary: true, target: new Surface(true) });
  root.onClick({ target: outside });
  assert.equal(removals, 0);
  root.onPointerDownCapture({ isPrimary: true, target: outside });
  root.onClick({ target: outside });
  assert.equal(removals, 1);
});
