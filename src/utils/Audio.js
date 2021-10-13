import { invlerp } from 'ish-utils/math';

const MAX8b = 255;

export class MicAnalyzer {
  constructor () {
    navigator.mediaDevices.getUserMedia(
      { video : false, audio : { latency: { ideal: 0.003 }} }
    ).then(
      this._onReady.bind(this),
      console.error,
    );
  }

  _onReady (stream) {
    this.ready = true;
    this.ctx = new AudioContext();
    this.mic = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.mic.connect(this.analyser); 

    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.cacheId = 0;
    this.onReady && this.onReady();
  }

  getVol (i = 0) {
    this.updateFreqData(i);

    let max = 0;
    // for (var j = 0; j < this.analyser.frequencyBinCount; j++) {
    for (var j = 0; j < 320; j++) {
      const d = this.freqData[j];
      max = d > max ? d : max;
      if (max >= MAX8b)
        return max;
    }
    return invlerp(0, MAX8b, max);
  }

  updateFreqData (i) {
    if (i !== this.cacheId)
      this.analyser.getByteFrequencyData(this.freqData);
    this.cacheId = i;
  }
}

export function drawSpectrum (sketch, freqData, fft = 1024) {
  const { width: W, height: H } = sketch.$canvas;
  const { ctx, iters } = sketch;

  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let i = 0; i < fft; i = i + 1)
    ctx.lineTo(W*Math.sqrt(i/fft), H - 1 - (freqData[i] / 255) * H);

  ctx.lineTo(W, H);
  // ctx.strokeStyle = 'red';
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, `hsla(${ iters/10 }, 50%, 50%, .1)`);
  gradient.addColorStop(.5, `hsla(${ iters/10 + 90 }, 50%, 50%, .1)`);
  gradient.addColorStop(1, `hsla(${ iters/10 + 180 }, 50%, 50%, .1)`);
  ctx.fillStyle = gradient;

  // ctx.fillStyle = `hsla(${ iters/10 }deg, 50%, 50%, .1)`;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.closePath();
}