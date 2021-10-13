const { userAgent } = window.navigator;
export const BROWSER = userAgent.includes('Chrome') ? 'Chrome'
  : userAgent.includes('Safari') ? 'Safari'
  : userAgent.includes('Firefox') ? 'Firefox'
  : userAgent.includes('Trident') || userAgent.includes('MSI') ? 'IE'
  : null;

export const OS = userAgent.includes('Mac') ? 'Mac'
  : userAgent.includes('Win') ? 'Win'
  : userAgent.includes('iP') ? 'iOS'
  : null;

export function checkUserEnv () {
  if (BROWSER !== 'Chrome' || OS === 'iOS') {
    if (navigator.language.indexOf('ru-') === 0)
      alert('Работает только в Chrome на Mac/Windows/Linux.\nОстальные браузеры пока не имеют необходимый функционал.');
    else
      alert('Your browser isn\'t supported.\nRun it in Chrome (Mac/Windows/Linux).');
    throw new Error('WRONG_BROWSER');
  }
}