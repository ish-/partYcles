import Vec from '@ish_/utils/PVector';
import { rand, lerp, smoothstep, clamp,
  circularEaseOut, doubleExponentialSeat, doubleExponentialSigmoid
} from '@ish_/utils/math';
import { checkEdges, checkEdgesMirror, perf } from './utils/common';
import Simplex from 'simplex-noise';
import * as QT from 'js-quadtree';

import TurbulenceField from './TurbulenceField';

console.log('worker.js', 'Inited');

let qt = new QT.QuadTree();
let useQuadTree = false;
const qtConfig = { capacity: 8, maximumDepth: 15 };

const turbField = new TurbulenceField({
  mult: .1,
  scale: .0035,
  seed: rand(0, 1e6),
});
let turbMorph = 0;

let circles = [];
let P = {
  distance: 85,
  mult: 1,
  mirrorEdges: false,
  attract: true,
  amount: 500,
  flock: 1,
  align: 1,
  wind: 0,
  gravity: 0,
  amount: 0,
  turbulence: false,
  turbMorph: 1,
  quadTree: true,
};

const ATTRACT_ANGLE = 45 / 180 * Math.PI;

let id = 0;
class Circle {
  constructor (opts/*: {x, y, a, sprite }*/) {
    Object.assign(this, opts);
    this.id = id++;
    !this.vel && (this.vel = new Vec(0, 0));
    !this.acc && (this.acc = new Vec(0, 0));
    !this.pos && (this.pos = new Vec(0, 0));
    this.lastPos = new Vec(this.pos);
  }

  applyForce (force) {
    this.acc.add(force);
  }

  attract (body) {
    let desired = new Vec(this.pos).sub(body.pos);
    const distance = desired.mag();
    if (distance > lesserSide / 4)
      return
    // if (Vec.angleBetween(desired, this.vel) > ATTRACT_ANGLE)
    //   return;
    const strength = (distance < P.distance ? 6 * P.align : -16 * P.flock)
      * P.mult / (distance * distance);
    desired.norm().mult(strength);
   
    this.applyForce(desired);
  }

  update () {
    this.lastPos = new Vec(this.pos);
    this.vel.add(this.acc)/*.mult(.999)*/.maxMag(2 * Math.sqrt(P.mult))//.rotateBy(Math.PI / 24 * rand(-1, 1));
    this.pos.add(new Vec(this.vel).mult(1));
    this.acc.set(0, 0);
  }
}

let W;
let H;
let lesserSide;
let iters = 0;
const gravity = new Vec(0, .01);
let lastMouseIter = 0;

const arrangements = {
  twoPoints (i) {
    let pos;
    if (W > H)
      pos = new Vec(rand() < .5 ? W/3+rand(-1, 1) : W/3*2+rand(-1, 1), H/2+rand(-1, 1));
    else
      pos = new Vec(W/2+rand(-1, 1), rand() < .5 ? H/3+rand(-1, 1) : H/3*2+rand(-1, 1));

    return new Circle({
      pos,
      vel: new Vec(rand(-1, 1), rand(-1, 1)),
      acc: new Vec(0, 0),
    });
  },

  voidCircle (i) {
    const angStep = Math.PI * 32 / P.amount;
    const r = lesserSide / 1.2;
    const pos = new Vec(
      Math.sin(angStep * i) * Math.sin(angStep * i / 10) * r + W/2,
      Math.cos(angStep * i) * Math.sin(angStep * i / 10) * r + H/2,
    );
    const vel = Vec.fromAngle(-angStep * i).mult(30);
    return new Circle({ pos })
  }
}

const cmds = {
  init (opts) {
    cmds.resize(opts);
    const { width = W, height = H, amount = P.amount, arrangement = 'twoPoints' } = opts;
    P.amount = amount;
    iters = 0;
    circles.length = 0;
    for (let i = 0; i < amount; i++) {
      circles.push(arrangements[arrangement](i))
    }

    return circles;
  },

  resize ({ width, height }) {
    W = width;
    H = height;
    lesserSide = Math.min(W, H);
  },

  params (params) {
    Object.assign(P, params);
  },
  
  update ({ mouse }) {
    let wind = new Vec(P.wind/80, P.gravity/80);
    wind = wind.mag() && wind;
    if (P.turbulence)
      turbMorph += P.turbMorph / 7;

    let percept = lesserSide / 4;

    mouse && (lastMouseIter = iters);
    useQuadTree = P.turbulence && iters > 100 && (!mouse && (iters - lastMouseIter > 100));
    if (useQuadTree) {
      // const p = perf('qt.insert');
      qt = new QT.QuadTree(new QT.Box(0, 0, W, H), qtConfig);
      circles.forEach((circle, cInd) => {
        qt.insert(new QT.Point(circle.pos.x, circle.pos.y, cInd));
      });
      // p();
    }

    let timeToQtQuery = 0;

    let turbForces;
    if (P.turbulence) {
      // const p = perf('TF.getForces')
      turbField.bounds = { bound: 240, W, H };
      turbForces = circles
        .map(circle => turbField.getAngledForce({ ...circle.pos, z: turbMorph }));
      // p();
    }

    // const p = perf('circles.forEach');
    circles.forEach((circle, k) => {
      if (mouse) {
        const desire = Vec.sub(new Vec(mouse), circle.pos);
        const str = desire.mag();
        circle.applyForce(desire.norm().mult(.1 * Math.sqrt(str/10)));
      }


      if (P.attract) {
        if (useQuadTree) {
          const points = qt.query(new QT.Circle(circle.pos.x, circle.pos.y, percept));
          for (let i = 0; i < points.length; i++) {
            const other = circles[points[i].data];
            if (circle !== other)
              circle.attract(other);
          }
        } else {
          for (let i = 0; i < circles.length; i++) {
            const other = circles[i];
            if (i !== k)
              circle.attract(other);
          }
        }
      }

      const bound = 240;

      if (P.turbulence)
        circle.applyForce(turbForces[k]);

      if (P.mirrorEdges)
        checkEdges(circle, W, H);
      else
        checkEdgesMirror(circle, W, H);

      if (wind)
        circle.applyForce(wind);

      circle.update();
    });
    // p();

    const amountDiff = P.amount - circles.length;
    if (amountDiff < 0) {
      circles = circles.slice(-amountDiff);
    } else if (amountDiff > 0) {
      for (let i = 0; i < amountDiff; i++) {
        circles.push(new Circle({
          pos: new Vec(rand(0, W-1), rand(0, H-1)),
          vel: new Vec(rand(-1, 1), rand(-1, 1)),
        }))
      }
    }

    iters++;
    return circles;
  },
};

self.onmessage = ({ data: { cmd, data, cmdId } }) => {
  const res = cmds[cmd](data);
  if (res)
    self.postMessage({ cmd, data: res, cmdId });
};