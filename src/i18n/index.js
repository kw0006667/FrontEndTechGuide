import zhTW from './locales/zh-TW.js';
import en from './locales/en.js';

const locales = {
  'zh-TW': zhTW,
  'en': en,
};

/**
 * Translate a key to the given locale.
 * Falls back to the key itself if not found.
 * @param {string} key
 * @param {string} [locale='zh-TW']
 * @returns {string}
 */
export function t(key, locale = 'zh-TW') {
  return locales[locale]?.[key] ?? key;
}

/**
 * Get all available locale codes.
 * @returns {string[]}
 */
export function getAvailableLocales() {
  return Object.keys(locales);
}
