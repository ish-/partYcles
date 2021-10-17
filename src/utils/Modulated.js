import { clamp } from 'ish-utils/math';
import { assignDefaults } from 'ish-utils/common';

export class Modulated {
  constructor (opts = {}) {
    assignDefaults(this, opts, {
      value: 0,
      min: null,
      max: null,
      clamp: false,
      modulator: v => v,
    });
  }

  get value () {
    const value = this.modulator(this._value);
    return this.clamp ? 
      clamp(this.min, this.max, value)
    : value;
  }

  set value (v) {
    return this._value = v;
  }
}

export function LFO (opts = {}) {

  let now = Date.now();
  function LFO (value) {
    const { fn, freq, amp } = LFO;
    now = Date.now();
    const mod = fn(now * freq / 1e3) * amp;
    return value + mod;
  }

  assignDefaults(LFO, opts, {
    amp: 1,
    freq: 1,
    // phase: 0, // rads
    fn: LFO.SIN,
  });

  return LFO;
}

LFO.SIN = (t) => Math.cos(t * Math.PI);
LFO.RECT = (t) => t % 2 < 1 ? 1 : -1;
LFO.TRI = (t) => {
  const fract = t / 2 % 1;
  return ((fract > .5 ? fract : 1 - fract) * 4) - 3;
}