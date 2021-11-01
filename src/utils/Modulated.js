import { clamp } from 'ish-utils/math';
import { assignDefaults, objProp } from 'ish-utils/common';

export class Modulated {
  constructor (opts = {}) {
    assignDefaults(this, opts, {
      value: 0,
      min: null,
      max: null,
      clamp: false,
      modulator: v => v,
    });
    console.log('Modulated.js', this);
  }

  valueOf () { return this.value }
  toString () { return this.value }

  get value () {
    const value = this.modulator.process(this._value);
    return this.clamp ? 
      clamp(this.min, this.max, value)
    : value;
  }

  set value (v) {
    return this._value = v;
  }

  bind (obj, target) {
    this.target = target;
    this.value = obj[target];
    objProp(obj, target, {
      get: () => this.value,
      set: (v) => (this.value = v),
    }, 'C');
    return this;
  }

  unbind (obj, target, opts = 'CW') {
    objProp(obj, target, this._value, opts);
    this.target = null;
    this.value = null;
    return this;
  }
}

// export function LFO (opts = {}) {

//   let now = Date.now();
//   function LFO_ (value) {
//     const { fn, freq, amp } = LFO_;
//     now = Date.now();
//     const mod = fn(now * freq / 1e3) * amp;
//     return value + mod;
//   }

//   assignDefaults(LFO_, opts, {
//     amp: 1,
//     freq: 1,
//     // phase: 0, // rads
//     fn: LFO.SIN,
//   });

//   return LFO_;
// }

export class LFO {
  constructor (opts = {}) {
    assignDefaults(this, opts, {
      amp: 1,
      freq: 1,
      phase: 0, // rads
      fn: LFO.SIN,
    });

    this.lastTime = Date.now();
  }

  process (value) {
    const { fn, freq, amp, phase } = this;
    const now = Date.now() - this.lastTime;
    const mod = fn(now * freq / 1e3 + phase * 2) * amp;
    this.lastTime = now;
    return value + mod;
  }
}

LFO.SIN = (t) => Math.cos(t * Math.PI);
LFO.RECT = (t) => t % 2 < 1 ? 1 : -1;
LFO.TRI = (t) => {
  const fract = t / 2 % 1;
  return ((fract > .5 ? fract : 1 - fract) * 4) - 3;
}