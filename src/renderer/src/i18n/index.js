import vi from './locales/vi.json';
import en from './locales/en.json';

// Kiến trúc i18n tối giản: mỗi ngôn ngữ là 1 file JSON phẳng (key -> chuỗi).
// Thêm ngôn ngữ mới sau này chỉ cần thêm 1 file JSON + đăng ký vào LOCALES,
// không cần đổi code ở nơi khác.
const LOCALES = { vi, en };
const FALLBACK = 'vi';

let currentLocale = 'vi';

export function setLocale(locale) {
  currentLocale = LOCALES[locale] ? locale : FALLBACK;
}

export function getLocale() {
  return currentLocale;
}

export function availableLocales() {
  return Object.keys(LOCALES);
}

// t('key', { name: 'X' }) — thay {name} trong chuỗi bằng giá trị tương ứng.
// Nếu thiếu key ở ngôn ngữ hiện tại, rơi về tiếng Việt rồi rơi về chính key
// (để không bao giờ hiện undefined ngoài UI).
export function t(key, vars) {
  const dict = LOCALES[currentLocale] || LOCALES[FALLBACK];
  let str = dict[key] ?? LOCALES[FALLBACK][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, v);
    }
  }
  return str;
}

export default { t, setLocale, getLocale, availableLocales };
