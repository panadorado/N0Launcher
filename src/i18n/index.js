// Bản dịch tối giản dùng ở main process — chỉ phủ các thông điệp lỗi hiển
// thị trực tiếp cho người dùng (auth.js). Log nội bộ (console.log/debug) cố
// tình giữ nguyên tiếng Việt vì là log cho dev, không phải UI.
const locales = {
  vi: require('./locales/vi.json'),
  en: require('./locales/en.json'),
};
const FALLBACK = 'vi';

function t(key, locale, vars) {
  const dict = locales[locale] || locales[FALLBACK];
  let str = dict[key] ?? locales[FALLBACK][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, v);
    }
  }
  return str;
}

module.exports = { t };
