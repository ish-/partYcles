import Qs from 'query-string';

export default {
  set (propName, val) {
    const prev = this.get();
    const nextSearch = Qs.stringify({
      ...prev,
      [propName]: val,
    });
    window.history.replaceState(null, window.document.title, '?' + nextSearch);
  },

  get (propName) {
    const obj = Qs.parse(window.location.search);
    return obj && propName ? obj[propName] : null;
  }
};

