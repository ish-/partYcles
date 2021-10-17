const $svg = document.createElement('svg');
Object.assign($svg.style, {
  width: 0, height: 0, position: 'absolute', zIndex: -1, pointerEvents: 'none',
});
document.body.appendChild($svg);

export class SVGFilter {
  constructor (name) {
    this.$el = document.createElementNS("http://www.w3.org/2000/svg", 'filter');
    this.$el.id = (name || 'filter');
    this.name = name;
    $svg.appendChild(this.$el);
  }

  append (fe) {
    this.$el.appendChild(fe.$el);
    return fe;
  }

  get url () { return `url(#${ this.name })` }

  get children () { return this.$el.children.map(feEl => feEl._fe) }
}

let uid = 0;
export class SVGFilterPrimitive {
  constructor (opts = {}, name) {
    this.$el = document.createElementNS('http://www.w3.org/2000/svg', name);
    // this.$el.id = opts.id || name + '-' + (uid++);
    this.$el.setAttribute('preserveAlpha', opts.preserveAlpha !== undefined || true);
    this.$el._fe = this;
  }
}

export class FeConvolve extends SVGFilterPrimitive {
  constructor (opts) {
    super(opts, 'feConvolveMatrix');

    this.$el.setAttribute('order', '3 3');

    this.edgeRange = opts.edgeRange;
    this.radius = opts.radius;
  }

  get radius () {
    return parseFloat(this.$el.getAttribute('kernelMatrix').split(' ')[4]);
  }

  set radius (v) {
    const mat = (this.$el.getAttribute('kernelMatrix') || '-1 -1 -1 -1 8 -1 -1 -1 -1').split(' ');
    // const mat = Array(9).fill((-v / (v+1)).toFixed(2));
    if (v === this.edgeRange[0]) v = 0;
    else if (v === (this.edgeRange[0] + this.edgeRange[1]) / 2) v = v + 0.001;
    mat[4] = v;
    return this.$el.setAttribute('kernelMatrix', mat.join(' '));
  }
}

export class FeMorphology extends SVGFilterPrimitive {
  constructor (opts) {
    super(opts, 'feMorphology');
    Object.assign(this, opts);
  }

  get radius () {
    const mult = this.$el.getAttribute('operator') === 'dilate' ? 1 : -1;
    return mult * Math.abs(parseFloat(this.$el.getAttribute('radius')));
  }

  set radius (v) {
    this.$el.setAttribute('operator', v > 0 ? 'dilate' : 'erode');
    this.$el.setAttribute('radius', Math.abs(v).toFixed(3));
    return v;
  }
}