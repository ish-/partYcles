import Vec from '@ish_/utils/PVector';
import Simplex from 'simplex-noise';
import { smoothstep } from '@ish_/utils/math';

const Y_OFFSET = 1000;

export default class TurbulenceField {
  constructor (opts/*: {
    scale: float,
    bound: float,
    mult: float,
    seed: number,
    simplex: Simplex,
  }*/) {
    Object.assign(this, opts);

    this.simplex = this.simplex || new Simplex(this.seed);
    this.bounds = opts.bounds;
  }

  getAngledForce (pos, bounds) {
    const nx = pos.x * this.scale;
    const ny = pos.y * this.scale;
    const nz = pos.z * this.scale;

    let rad = this.simplex.noise3D(
      pos.x * this.scale,
      pos.y * this.scale,
      pos.z * this.scale,
    ) * 1.1;
    const force = Vec.fromAngle(rad * Math.PI).mult(this.mult);

    return this.calcBounds(pos, force, bounds);
  }

  calcBounds (pos, force, bounds) {
    const { bound, W, H } = bounds || this.bounds || {};
    if (bound) {
      let distToW = W/2 - Math.abs(W/2 - pos.x);
      if (distToW < bound)
        force.mult(1 - smoothstep(W/2 - bound, W/2, distToW) / bound);
      const distToH = H/2 - Math.abs(H/2 - pos.x);
      if (distToH < bound)
        force.mult(1 - smoothstep(H/2 - bound, H/2, distToH) / bound);
    }
    return force;
  }

  getForce (pos, bounds) {
    const nx = pos.x * this.scale;
    const ny = pos.y * this.scale;
    const nz = pos.z * this.scale;

    let x = this.simplex.noise3D(
      pos.x * this.scale,
      pos.y * this.scale,
      pos.z * this.scale,
    ) * 1.1;

    let y = this.simplex.noise3D(
      pos.x * this.scale + Y_OFFSET,
      pos.y * this.scale + Y_OFFSET,
      pos.z * this.scale + Y_OFFSET,
    ) * 1.1;

    const force = new Vec(x, y);
    return this.calcBounds(pos, force, bounds);
  }
}
