import { Pane } from 'tweakpane';

import { askWorker, sendWorker, descriptForWorker,
  record } from './utils/common';
import { jsonCopy, objProp } from '@ish_/utils/common';
import { lerp, invlerp } from '@ish_/utils/math';
import qs from './utils/qs';

import { MicAnalyzer, drawSpectrum } from './utils/Audio';
import { SketchControls, Presets } from './utils/Pane';
import { Modulated, LFO } from './utils/Modulated';
import { SVGFilter, FeMorphology, FeConvolve } from './utils/SVGFilters';
import Sketch from './utils/Sketch';
import Offscreen from './utils/Offscreen';
import palletes from './palletes';

import defaultPresets from './defaultPresets';
import protoPreset from './protoPreset';
import { checkUserEnv } from './utils/userEnv';

checkUserEnv();

const DEFAULT_PRESET = 'Default';
const modedParams = ['None', 'contrast','blur','opacity','opacityCanv','morphRad','edgeRad', 'size'];

const circlesWorker = new Worker(new URL('./worker.js', import.meta.url), {
  name: 'circlesWorker',
  type: 'module',
  // type: import.meta.env.MODE === 'development' ? "module" : "classic",
});

let W, H, O = protoPreset;
const art = new Sketch({
  /*width: 1280, height: 720, */
  fullwidth: true,
  bindKeys: {
    p (e) {
      pane.expanded = !pane.expanded;
      art.$stats.style.display = pane.expanded ? 'inline-block' : 'none';
    },
    o (e) { fxFld.expanded = !fxFld.expanded },
    u (e) { lfoFld.expanded = !lfoFld.expanded },
    n (e) { micFld.expanded = !micFld.expanded },
    i (e) { partsFld.expanded = !partsFld.expanded },
    q (e) { toggleRecording() },
    '/': init,
  },
  onResize ({ width, height }) {
    W = width; H = height;
    sendWorker.call(circlesWorker, 'resize', { width, height });
  },
});
window.$art = art;

const DEFAULTS = defaultPresets[DEFAULT_PRESET];

// SVG Filters
const feMorphology = new FeMorphology({ radius: 2 });
const morph = new SVGFilter('morph');
morph.append(feMorphology);

const EDGE_RANGE = [7, 10];
const feConvolve = new FeConvolve({ radius: 2, edgeRange: EDGE_RANGE });
const edge = new SVGFilter('edge');
edge.append(feConvolve);

// Options
// objProp.ref(feMorphology, 'radius', O, 'morphRad');
// objProp.ref(feConvolve, 'radius', O, 'edgeRad');
O.spectrum = true;
O.feedbackOnly = false;
Object.assign(O, jsonCopy(DEFAULTS));

// Worker Options
descriptForWorker(circlesWorker, 'params', O, 'attract');
descriptForWorker(circlesWorker, 'params', O, 'distance');
descriptForWorker(circlesWorker, 'params', O, 'flock');
descriptForWorker(circlesWorker, 'params', O, 'align');
descriptForWorker(circlesWorker, 'params', O, 'mult');
descriptForWorker(circlesWorker, 'params', O, 'mirrorEdges');
descriptForWorker(circlesWorker, 'params', O, 'amount');
descriptForWorker(circlesWorker, 'params', O, 'wind');
descriptForWorker(circlesWorker, 'params', O, 'gravity');
descriptForWorker(circlesWorker, 'params', O, 'turbulence');
descriptForWorker(circlesWorker, 'params', O, 'turbMorph');

// Pane Controls
const pane = window.$pane = new Pane();
pane.expanded = false;

const ctrls = pane.addFolder({ title: 'Preferences [P]' });
const presets = new Presets({
  pane, defaultPresets,
  folder: ctrls,
  defaultPresetName: DEFAULT_PRESET,
});

const { toggleRecording } = new SketchControls(ctrls, art, init);

const mic = new MicAnalyzer();
mic.onReady = init;

const mon = { avgVol: 0, minVol: 0, dynVol: 0 };
// const micFld = pane.addFolder({ title: 'Mic [M]' });

// const interval = 50;
// micFld.addMonitor(mon, 'avgVol', {
//   view: 'graph',
//   min: 0, max: 1, interval,
// });

// micFld.addMonitor(mon, 'minVol', {
//   view: 'graph',
//   min: 0, max: 1, interval,
// });

// micFld.addMonitor(mon, 'dynVol', {
//   view: 'graph',
//   min: 0, max: .5, interval,
// });

const micFld = ctrls.addFolder({ title: 'Mic [N]' })
micFld.addInput(O, 'micOn');
micFld.addInput(O, 'spectrum');

const step = .001;
const fxFld = ctrls.addFolder({ title: 'Effects [O]' });
fxFld.addInput(O, 'feedbackOnly');
fxFld.addInput(O, 'translate', {
  x: { min: -5, max: 5 },
  y: { min: -5, max: 5 },
});
fxFld.addInput(O, 'contrast', { min: 0, max: 3, step });
fxFld.addInput(O, 'invContrast');
fxFld.addInput(O, 'blur', { min: 0, max: 10, step });
fxFld.addInput(O, 'opacity', { min: 0, max: 1, step });
fxFld.addInput(O, 'opacityCanv', { min: 0, max: 1, step });
fxFld.addInput(O, 'morphRad', { min: -10, max: 10, step });
fxFld.addInput(O, 'edgeRadOn');
fxFld.addInput(O, 'edgeRad', { min: EDGE_RANGE[0], max: EDGE_RANGE[1], step });

fxFld.addSeparator();

const partsFld = ctrls.addFolder({ title: 'Particles [I]', expanded: false });
partsFld.addInput(O, 'color', {
  options:
    Object.keys(palletes).map(text => ({ text, value: text })),
});
partsFld.addInput(O, 'size', { min: 0, max: 6 });
partsFld.addInput(O, 'attract');
partsFld.addInput(O, 'amount', { min: 0, max: 1000, step: 1 });
partsFld.addInput(O, 'flock', { min: 0, max: 2 });
partsFld.addInput(O, 'align', { min: 0, max: 2 });
partsFld.addInput(O, 'distance', { min: 15, max: 150 });
partsFld.addInput(O, 'mult', { min: 0, max: 10 });
partsFld.addInput(O, 'mirrorEdges');
partsFld.addInput(O, 'wind', { min: -3, max: 3 });
partsFld.addInput(O, 'gravity', { min: -3, max: 3 });
partsFld.addInput(O, 'turbulence');
partsFld.addInput(O, 'turbMorph', { min: 0, max: 300 });


// MODULATORS
const lfoFld = ctrls.addFolder({ title: 'LFOs [U]' });
const NONE_TARGET = '';

function addLFO (name, opts) {
  const lfo = new LFO({ amp: .5, freq: 1 });

  const modulated = new Modulated({ modulator: lfo });

  let lastTarget = NONE_TARGET;
  const lfoBlade = lfoFld.addBlade({
    label: name + ' target',
    view: 'list',
    options: modedParams.map(value => ({ text: value, value })),
    value: opts.target || NONE_TARGET,
  }).on('change', e => {
    const { value: target } = e;
    if (target === NONE_TARGET) {
      if (lastTarget !== NONE_TARGET)
        modulated.unbind(O, lastTarget);
    }
    else
      modulated.bind(O, target);

    lastTarget = target;
  });

  const PANE_NAME = 'amp/freq/phase';
  const localPane = { [PANE_NAME]: opts };
  objProp.ref(opts, 'x', lfo, 'amp');
  objProp.ref(opts, 'y', lfo, 'freq');
  objProp.ref(opts, 'z', lfo, 'phase');
  const XY_MINMAX = { min: -5, max: 5, step: .1 };
  // lfoFld.addInput(localPane, PANE_NAME, {
  //   x: XY_MINMAX,
  //   y: XY_MINMAX,
  //   z: { min: 0, max: 1, step: .1  },
  // });
  
  const _o = {
    get [PANE_NAME] () { return opts },
    set [PANE_NAME] (o) {
      console.log('!!', o);
      Object.assign(opts, o);
      return o;
    }
  };
  lfoFld.addInput(_o, PANE_NAME, {
    x: XY_MINMAX,
    y: XY_MINMAX,
    z: { min: 0, max: 1, step: .1  },
  });

  // lfoFld.addInput(lfo, 'amp');
  // lfoFld.addInput(lfo, 'freq');
}

addLFO('LFO1', O.lfo1);
// addLFO('LFO2');

function addMicModulation (target) {
  const modulated = new Modulated({
    modulator: {
      process: (v) => v + (O.micOn ? mon.avgVol*15-2 : 0),
    },
  });
  let lastTarget = NONE_TARGET;

  micFld.addBlade({
    label: 'mic target',
    view: 'list',
    options: modedParams.map(value => ({ text: value, value })),
    value: target || NONE_TARGET,
  }).on('change', e => {
    const { value: target } = e;
    if (target === NONE_TARGET) {
      if (lastTarget !== NONE_TARGET)
        modulated.unbind(O, lastTarget);
    }
    else
      modulated.bind(O, target);
    lastTarget = target;
  });
}

addMicModulation(O.micTarget);

let preset = presets.list[presets.current];
if (!preset)
  preset = presets.list[DEFAULT_PRESET];
console.log('Init \w preset: ', preset);
pane.importPreset(preset);


function drawCircle (ctx, circle, i, opts) {
  ctx.beginPath();
  const { color, size } = opts;
  const colors = palletes[color];
  ctx.strokeStyle = colors[circle.id % colors.length] + '66';
  ctx.moveTo(circle.lastPos.x, circle.lastPos.y);
  ctx.lineCap = (size > 2) ? 'round' : 'butt';
  ctx.lineWidth = size * 2// + circle.atrcTo;
  if (size > 0) {
    ctx.lineTo(circle.pos.x, circle.pos.y);
    ctx.stroke();
  }
  ctx.closePath();
}

const feedback = new Offscreen({ parent: art, padding: 50, real: false });
window.$feedback = feedback;

const circlesScreen = new Offscreen({ parent: art, real: false, alpha: true });

function init () {
  feedback.clear();
  art.clear();
  askWorker.call(circlesWorker, 'init', {
      width: art.W,
      height: art.H,
      amount: O.amount,
      arrangement: 'voidCircle',
  }).then((circles) => art.animate(animate, circles));
}

let minVol = 0;

function animate (c, circles) {
  const p = askWorker.call(circlesWorker, 'update', { mouse: art.mouse });

  if (O.micOn) {
    const vol = mic.getVol(art.iters);
    minVol += vol < minVol ?
      (vol - minVol) / 1
    : (vol - minVol) / 100;
    mon.minVol = minVol;
    // const avgVol = mon.avgVol = range(0, 1, minVol, 1, vol);
    const avgVol = mon.avgVol = invlerp(Math.min(.5, minVol + .03),  1, lerp(0, 1, vol));
    mon.dynVol = avgVol - minVol;
  }

  feMorphology.radius = O.morphRad;
  feConvolve.radius = O.edgeRad;

  feedback.letThrough(
    `blur(${ O.blur }px) contrast(${ O.contrast }) contrast(${ 1/(O.invContrast ? O.contrast : 1) }) opacity(${ O.opacity })`,
    null,
    ({ ctx }) => {
      art.ctx.translate(O.translate.x, O.translate.y);
      art.ctx.filter = `${ morph.url } ${ O.edgeRadOn ? edge.url : '' } opacity(${ O.opacityCanv })`;
    }
  );

  if (O.micOn && O.spectrum)
    drawSpectrum(art, mic.freqData, 480);

  art.ctx.setTransform(1, 0, 0, 1, 0, 0);
  art.ctx.filter = 'none';

  circlesScreen.clear(true);
  const opts = { ...O };
  circles.forEach((circle, i) => drawCircle(circlesScreen.ctx, circle, i, opts));
  (O.feedbackOnly ? feedback : art ).putImage(circlesScreen);

  return p;
};

if (qs.get('record'))
  toggleRecording();

setTimeout(() => {
  pane.expanded = true;
}, 500)

export default null;