export function checkEdges (body, width, height, bound = 0) {
  const { pos, vel } = body;
  if (pos.x - bound >= width) {
    pos.x = width + bound;
    vel.x *= -1;
  } else if (pos.x + bound < 0) {
    vel.x *= -1;
    pos.x = 0 - bound;
  }
 
  if (pos.y - bound >= height) {
    vel.y *= -1;
    pos.y = height + bound;
  } else if (pos.y + bound < 0) {
    vel.y *= -1;
    pos.y = 0 - bound;
  }
}

export function checkEdgesMirror (body, width, height) {
  const { pos, vel } = body;
  if (pos.x > width) {
    pos.x = 0;
  } else if (pos.x < 0) {
    pos.x = width;
  }
 
  if (pos.y > height) {
    pos.y = 0;
  } else if (pos.y < 0) {
    pos.y = height;
  }
}

export function sendWorker (cmd, data) {
  this.postMessage({ cmd, data });
}

let _cmdId = 1;
export function askWorker (cmd, data) {
  const cmdId = _cmdId++;
  return new Promise(resolve => {
    function _getAnswer ({ data: answer }) { 
      if (answer.cmd === cmd) {
        if (!answer.cmdId || answer.cmdId < cmdId)
          return;
        if (answer.cmdId === cmdId)
          resolve(answer.data);
      }
      this.removeEventListener('message', _getAnswer);
    }
    this.addEventListener('message', _getAnswer);
    this.postMessage({ cmd, data, cmdId });
  });
}

export function descriptForWorker (worker, cmd, obj, key, val = obj[key], onChange) {
  const privKey = '_' + key;
  obj[privKey] = val;
  Object.defineProperty(obj, key, {
    get () { return obj[privKey] },
    set (v) { 
      obj[privKey] = v;
      onChange?.(v, key);
      return sendWorker.call(worker, 'params', { [key]: v });
    }
  })
}

export function record ($canvas, { time, onstop = download } = {}) {
  var recordedChunks = [];

  var stream = $canvas.captureStream(60 /*fps*/);
  const mediaRecorder = new MediaRecorder(stream, {
    // mimeType: "video/webm; codecs=vp9",
    mimeType: 'video/webm; codecs=h264',
    // mimeType: 'video/mp4; codecs="avc1.4d002a"',
    videoBitsPerSecond : 20e6,
  });

  mediaRecorder.start(time);

  mediaRecorder.ondataavailable = function (e) {
    recordedChunks.push(event.data);
    if (mediaRecorder.state === 'recording')
      mediaRecorder.stop();
  }

  mediaRecorder.onstop = function (event) {
    onstop(new Blob(recordedChunks, { type: 'video/webm' }));
  }

  return mediaRecorder;
}

export function download (blob) {
  var url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', 'yeah-' + Date.now().toString());
  a.click();
}

export function perf (name) {
  const start = performance.now();
  return function perfStop () {
    return console.log('Perf: ', name, performance.now() - start);
  }
}