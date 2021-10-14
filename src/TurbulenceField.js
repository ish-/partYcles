import Vec from 'ish-utils/PVector';
import Simplex from 'simplex-noise';
import { smoothstep } from 'ish-utils/math';

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
  }

  getForce (pos, { bound, W, H } = {}) {
    const nx = pos.x * this.scale;
    const ny = pos.y * this.scale;
    const nz = pos.z * this.scale;

    let rad = this.simplex.noise3D(
      pos.x * this.scale,
      pos.y * this.scale,
      pos.z * this.scale,
    ) * 1.1;
    const force = Vec.fromAngle(rad * Math.PI).mult(this.mult);

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
}
