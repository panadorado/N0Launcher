// Chạy trong renderer (browser) như một ES module, KHÔNG qua IPC.
// Lý do: các trang này chỉ dựng chuỗi HTML từ dữ liệu có sẵn, không cần
// quyền truy cập Node/OS của main process. Gửi hàm qua IPC là không thể
// (Electron chỉ clone được dữ liệu, không clone được function), nên việc
// "phục vụ trang" phải nằm ở phía renderer.
import renderHome from './home.js';
import renderSettings from './setting.js';
import renderVersions from './version.js';
import renderLogin from './login.js';
import { renderMods } from './mods.js';

const pages = {
  home: renderHome,
  settings: renderSettings,
  versions: renderVersions,
  login: renderLogin,
  mods: renderMods,
};

export function getPages(pageName) {
  return pages[pageName];
}
