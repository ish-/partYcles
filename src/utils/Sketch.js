import Vec from 'ish-utils/PVector';
import { debounce } from 'ish-utils/common';

const _bindKeys = {
  's': 'savePng',
  ' ': 'togglePause',
};

export default class Sketch {
  constructor (opts = {}) {
    let { $el,
          fullwidth = true,
          autoclear,
          bindKeys,
          alpha = true,
          smoothing = false,
    } = opts;

    this.opts = opts;
    this.fullwidth = fullwidth;
    this.pause = false;
    this.iters = 0;
    this.bindKeys = Object.assign({}, _bindKeys, bindKeys);
    this.now = Date.now();
    this.perfStr = '';


    if (!$el) {
      $el = document.createElement('div');
      $el.className = 'sk-cont';
      document.body.appendChild($el);
    }
    this.$el = $el;

    this.$stats = document.createElement('div');
    this.$stats.className = 'sk-stats';
    this.$el.appendChild(this.$stats);

    this.$canvas = document.createElement('canvas');
    this.$el.appendChild(this.$canvas);
    this.$canvas.className = 'sk-canvas';

    this.ctx = this.$canvas.getContext('2d', { alpha });

    this.ctx.imageSmoothingEnabled = !!smoothing;
    if (smoothing)
      this.ctx.imageSmoothingQuality = smoothing;

    bindMouseEvents(this);
    this.onResize();
    // this.onResize = debounce(this.onResize.bind(this), 200);
    this.animate = this.animate.bind(this);
    window.addEventListener('resize', debounce(this.onResize.bind(this), 200));

    window.addEventListener('keydown', e => {
      const method = this.bindKeys[e.key];
      if (method) {
        e.preventDefault();
        if (method instanceof Function)
          method.call(this, e);
        else {
          this[method](e);
        }
      }
    })
  }

  onResize (e) {
    console.log('Sketch::onResize', e);
    this.$canvas.width = this.W = this.fullwidth ? window.innerWidth : this.opts.width;
    this.$canvas.height = this.H = this.fullwidth ? window.innerHeight : this.opts.height;
    this.opts.onResize && this.opts.onResize({ width: this.W, height: this.H });
  }

  savePng () {
    const url = this.$canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'yeah-' + Date.now().toString());
    a.click();
  }

  togglePause (e) {
    this.pause = !this.pause;
  }

  putImage (from, filter, gco) {
    const { padding: P = 0 } = from.opts;
    const { width: W, height: H } = this.$canvas;
    // if (this.$canvas.width !== W || this.$canvas.height !== H) {
    //   const imgData = this.ctx.getImageData(0, 0, this.$canvas.width, this.$canvas.height);
    //   this.$canvas.width = W;
    //   this.$canvas.height = H;
    //   this.ctx.filter = 'none';
    //   this.ctx.putImageData(imgData, 0, 0);
    // }
    this.ctx.filter = filter || 'none';
    this.ctx.globalCompositeOperation = gco || 'source-over';
    // this.ctx.drawImage(from.$canvas, P, P, W, H, 0, 0, W, H);
    this.ctx.drawImage(from.$canvas, P, P, W, H, 0, 0, W, H);
    this.ctx.filter = 'none';
  }

  clear (color = 'black') {
    if (color === true) {
      this.ctx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
      return;
    }
    this.ctx.fillStyle = this.opts.refill || color;
    this.ctx.rect(0, 0, this.$canvas.width, this.$canvas.height);
    this.ctx.fill();
    this.ctx.fillStyle = 'none';
  }

  async animate (fn, res) {
    this.now = Date.now();

    if (this.iters % 30 === 0)
      this.$stats.textContent = (Math.round(1/((this.now - this.lastNow) / 1e3))) + ' fps' + this.perfStr;

    if (this.pause) {
      this.perfStr = '';
      window.requestAnimationFrame(this.animate.bind(this, fn, res));
      return;
    }

    if (this.opts.autoclear)
      this.clear();

    res = await fn(this, res);
    // this.ctx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);

    if ((this.iters + 1) % 30 === 0)
      this.perfStr = ' / ' + String(((Date.now() - this.now) / .16)|0).padStart(3, '') + '% cpu';

    this.iters++;
    this.lastNow = this.now;
    window.requestAnimationFrame(this.animate.bind(this, fn, res));
    // setTimeout(this.animate.bind(this, fn, res), 0);
  }
}


function bindMouseEvents (o) {
  o.mouse = null;
  const { $canvas } = o;

  window.TouchEvent = window.TouchEvent || onMouseDown;
  function onMouseDown (e) {
    if (e instanceof TouchEvent)
      o.mouse = new Vec(e.touches[0].layerX, e.touches[0].layerY);
    else
      o.mouse = new Vec(e.layerX, e.layerY);
  }
  $canvas.addEventListener('mousedown', onMouseDown);
  $canvas.addEventListener('touchstart', onMouseDown);
  function onMouseMove (e) {
    e.preventDefault();
    if (o.mouse) {
      if (e instanceof TouchEvent) {
        o.mouse = new Vec(e.touches[0].layerX, e.touches[0].layerY);
      } else
        o.mouse = new Vec(e.layerX, e.layerY);
    }
  }
  $canvas.addEventListener('mousemove', onMouseMove);
  $canvas.addEventListener('touchmove', onMouseMove);
  function onMouseUp (e) {
    e.preventDefault();
    o.mouse = null;
  }
  $canvas.addEventListener('mouseup', onMouseUp);
  $canvas.addEventListener('touchend', onMouseUp);
}