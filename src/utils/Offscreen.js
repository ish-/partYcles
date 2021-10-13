export default class Offscreen {
  constructor (opts) {
    const { real, parent, filter, padding: P = 0, alpha = false, smoothing = false } = opts;
    this.opts = opts;

    if (real || !window.OffscreenCanvas) {
      this.$canvas = document.createElement('canvas');
      document.body.appendChild(this.$canvas);
    }
    else
      this.$canvas = new OffscreenCanvas(parent.$canvas.width, parent.$canvas.height);

    this.$canvas.width = (parent?.$canvas.width || width) + P*2;
    this.$canvas.height = (parent?.$canvas.height || height) + P*2;
    this.ctx = this.$canvas.getContext('2d', { alpha });
    this.ctx.imageSmoothingEnabled = !!smoothing;
    if (smoothing)
      this.ctx.imageSmoothingQuality = smoothing;
    this.ctx.filter = filter || 'none';
  }

  get width () { return parent?.$canvas.width || this.opts.width }
  get height () { return parent?.$canvas.height || this.opts.height }

  clear (color = 'black') {
    if (color === true) {
      this.ctx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
      return;
    }
    this.ctx.rect(0, 0, this.$canvas.width, this.$canvas.height);
    const _fillStyle = this.ctx.fillStyle;
    const _filter = this.ctx.filter;
    this.ctx.fillStyle = color;
    this.ctx.filter = 'none';
    this.ctx.fill();
    this.ctx.fillStyle = _fillStyle;
    this.ctx.filter = _filter;
  }

  putImage (from, filter, gco = 'source-over') {
    const P = this.opts.padding || 0;
    const { width: W, height: H } = from.$canvas;
    if (this.$canvas.width !== W + P*2 || this.$canvas.height !== H + P*2) {
      const imgData = this.ctx.getImageData(0, 0, this.$canvas.width, this.$canvas.height);
      this.$canvas.width = W + P*2;
      this.$canvas.height = H + P*2;
      this.ctx.filter = 'none';
      this.ctx.putImageData(imgData, 0, 0);
    }
    this.ctx.filter = filter || 'none';
    this.ctx.globalCompositeOperation = gco;
    // this.ctx.drawImage(from.$canvas, P, P, W, H, 0, 0, W, H);
    // this.ctx.drawImage(from.$canvas, 0, 0, W, H/*, P, P, W, H*/);
    this.ctx.drawImage(from.$canvas, 0, 0, W, H);
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.filter = 'none';
  }

  letThrough (filter, gco, beforeReturn) {
    const from = this.opts.parent;
    const P = this.opts.padding || 0;
    const { width: W, height: H } = from.$canvas;
    if (this.$canvas.width !== W || this.$canvas.height !== H) {
      const imgData = this.ctx.getImageData(0, 0, this.$canvas.width, this.$canvas.height);
      this.$canvas.width = W;
      this.$canvas.height = H;
      this.ctx.filter = 'none';
      this.ctx.putImageData(imgData, 0, 0);
    }
    this.ctx.filter = filter || 'none';
    this.ctx.globalCompositeOperation = gco || 'source-over';
    // this.ctx.drawImage(from.$canvas, P, P, W, H, 0, 0, W, H);
    this.ctx.drawImage(from.$canvas, 0, 0, W, H);
    beforeReturn && beforeReturn(this);
    // from.ctx.drawImage(this.$canvas, 0, 0, W, H, P, P, W, H);
    from.ctx.drawImage(this.$canvas, 0, 0, W, H);
  }
}