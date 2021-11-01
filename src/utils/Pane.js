import { record } from './common';
import { jsonCopy } from '@ish_/utils/common';
import bs from './bokalSourage';
import qs from './qs';

export function Presets ({
  pane,
  folder = pane,
  defaultPresets,
  defaultPresetName,
}) {
  const _presets = {
    [defaultPresetName] : {},
    ...bs.get('presets'),
    ...defaultPresets,
  };

  let current = qs.get('preset') || defaultPresetName;
  if (!_presets.hasOwnProperty(current))
    current = defaultPresetName;

  const presets = {
    list: _presets,
    current,

    save () {
      const preset = pane.exportPreset();
      const name = window.prompt('Preset name: ', presetsBlade.value);
      if (!name)
        return;
      if (defaultPresets.hasOwnProperty(name))
        return alert('Please, select another name :) You can\'t save with the same name as pre-installed preset. ')
      presets.list[name] = preset;
      presets.current = name;
      presetsBlade.value = name;
      presetsBlade.options = [{ text: name, value: name }, ...presetsBlade.options];
      this.saveLocal(name, preset);
    },

    saveLocal (name, preset) {
      // presetsBlade.options = Object.keys(presets.list).map(value => ({ text: value, value })).reverse();
      bs.set('presets', {
        ...bs.get('presets'),
        ...(name && preset ? { [name]: preset } : null),
      });
      qs.set('preset', presetsBlade.value);
    },

    remove () {
      const name = presetsBlade.value;
      if (name === defaultPresetName)
        return;
      presetsBlade.value = defaultPresetName;
      delete presets.list[name];
      this.saveLocal();
    }
  };

  window.onbeforeunload = () => presets.saveLocal();

  const presetsBlade = folder.addBlade({
    label: 'Presets',
    view: 'list',
    options: Object.keys(presets.list).map(value => ({ text: value, value })).reverse(),
    value: presets.current,
  }).on('change', ({ value }) => {
    pane.importPreset(jsonCopy(presets.list[value]));
    presets.saveLocal();
  });
  folder.addButton({ title: 'Save preset' }).on('click', () => presets.save());
  folder.addButton({ title: 'Delete preset' }).on('click', () => presets.remove());

  return presets;
}

export function SketchControls (folder, sketch, init) {
  folder.addButton({ title: 'Save PNG [S]' }).on('click', () => sketch.savePng());
  const pauseBtn = folder.addButton({ title: 'Pause [Space]' }).on('click', () => {
    sketch.pause = !sketch.pause;
    pauseBtn.title = sketch.pause ? 'Play' : 'Pause';
  });
  folder.addButton({ title: 'Restart [/]' }).on('click', init);

  const recBtn = folder.addButton({ title: 'Record [Q]' }).on('click', toggleRecording);
  let recorder;
  function toggleRecording () {
    if (!recorder) {
      recorder = record(sketch.$canvas);
    } else {
      recorder.stop();
      recorder = null;
    }
    recBtn.title = recorder ? 'Stop rec [Q]' : 'Record [Q]';
  }

  return {
    toggleRecording,
  };
}