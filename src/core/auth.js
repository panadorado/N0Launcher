const { Auth, lexicon } = require("msmc");
const { Authflow, Titles } = require('prismarine-auth');
const { getApiElyBy } = require('./service');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { loadConfig } = require('./config');
const i18n = require('../i18n');

function currentLocale() {
  return loadConfig().locale || 'vi';
}

// Thư mục cache token của prismarine-auth — cho phép giữ đăng nhập giữa các
// lần mở launcher (refresh token còn hạn thì không cần hiện lại mã nữa),
// khác với cách msmc cũ dùng (không cache, phải đăng nhập lại mỗi lần token
// hết hạn).
const MSA_CACHE_DIR = path.join(app.getPath('userData'), 'msa-cache');
const MSA_CACHE_KEY = 'n0launcher';

function offlineUuidFor(username) {
  const hash = crypto.createHash('md5').update(`OfflinePlayer:${username}`, 'utf8').digest();
  hash[6] = (hash[6] & 0x0f) | 0x30; // đặt version = 3
  hash[8] = (hash[8] & 0x3f) | 0x80; // đặt variant theo RFC 4122
  const hex = hash.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function jsonData(token, secret, uuid, name, type) {
  return (type === 'elyby') ? {
    access_token: token,
    client_token: secret,
    uuid: uuid,
    name: name,
    meta: { type },
  }:{
    access_token: token,
    uuid: uuid,
    name: name,
    meta: { type }
  };
}

async function loginWithMicrosoftAccount() {
  const authManager = new Auth("select_account");
  return await authManager.launch('electron', {
    width: 500,
    height: 650,
    resizable: false,
    autoHideMenuBar: true,
    title: "Đăng nhập Microsoft",
    icon: path.join(__dirname, '../assets/N0Launcher.png'),
  })
  .then(async xboxManager => {
    const result = await xboxManager.getMinecraft();
    return jsonData(result.mcToken, '', result.profile.id, result.profile.name, 'msa')
  })
  .catch(err => {
    const wrapped = lexicon.wrapError(err);
    if (wrapped.name === "error.gui.closed") {
      wrapped.message = 'Người dùng đã hủy đăng nhập!';
      throw new Error(wrapped.message);
    }
    else {
      console.error("[auth:loginWithMicrosoftAccount] Login failed:", wrapped.name, wrapped.message);
      throw new Error(wrapped.message)
    }
  });
}

// Đăng nhập Microsoft bằng luồng "device code": KHÔNG mở cửa sổ nhúng nào để
// nhập mật khẩu — launcher chỉ nhận 1 mã ngắn (onDeviceCode) và người dùng
// tự mở trình duyệt hệ thống (microsoft.com/link) để xác thực. Mật khẩu/phiên
// đăng nhập Microsoft không bao giờ đi qua code của launcher, khác hẳn cách
// nhúng webview cũ (msmc) — đây chính là lý do đổi thư viện.
//
// LƯU Ý QUAN TRỌNG: `flow: 'msal'` (dùng authTitle làm client ID Azure AD
// thật) chỉ hợp lệ cho đăng nhập bằng mật khẩu trực tiếp (xem ví dụ chính
// thức examples/mcpc/password.js của prismarine-auth) — dùng nó cho device
// code sẽ bị Microsoft trả lỗi "invalid_grant" ngay lập tức. Device code cho
// Minecraft Java phải dùng `flow: 'live'` kèm `Titles.MinecraftNintendoSwitch`
// + `deviceType: 'Nintendo'`, đúng như ví dụ chính thức
// examples/mcpc/deviceCode.js — đã kiểm chứng lại từ log lỗi thực tế.
//
// LƯU Ý QUAN TRỌNG #2: `flow: 'live'` dùng LiveTokenManager (không phải
// MsaTokenManager của MSAL) — response trả về cho callback là JSON thô của
// live.com, dùng snake_case (`user_code`, `verification_uri`, `device_code`,
// `expires_in`), KHÁC với response camelCase của MSAL (`userCode`,
// `verificationUri`...). Phải tự chuẩn hoá về camelCase ở đây trước khi gửi
// cho renderer, nếu không renderer đọc `deviceCode.userCode` sẽ luôn ra
// undefined và modal không bao giờ hiện được mã (đã xảy ra thật khi đổi flow).
async function loginWithMicrosoftAuthentication(onDeviceCode) {
  const authflow = new Authflow(MSA_CACHE_KEY, MSA_CACHE_DIR, {
    flow: 'live',
    authTitle: Titles.MinecraftNintendoSwitch,
    deviceType: 'Nintendo',
  }, (deviceCode) => {
    if (typeof onDeviceCode !== 'function') return;
    onDeviceCode({
      userCode: deviceCode.user_code ?? deviceCode.userCode,
      verificationUri: deviceCode.verification_uri ?? deviceCode.verificationUri,
      message: deviceCode.message,
      expiresIn: deviceCode.expires_in ?? deviceCode.expiresIn,
      interval: deviceCode.interval,
    });
  });

  let result;
  try {
    result = await authflow.getMinecraftJavaToken({ fetchProfile: true });
  } catch (err) {
    console.error('[auth:loginWithMicrosoftAuthentication] Login failed:', err?.message || err);
    throw new Error(err?.message || i18n.t('auth.msaLoginFailed', currentLocale()));
  }

  if (!result?.profile?.id || !result?.profile?.name) {
    // fetchProfile thất bại (bị nuốt lỗi bên trong prismarine-auth) thường vì
    // tài khoản Microsoft này chưa sở hữu Minecraft Java Edition hoặc chưa
    // từng tạo nhân vật (migrate tài khoản Mojang cũ).
    throw new Error(i18n.t('auth.msaNoProfile', currentLocale()));
  }

  return jsonData(result.token, '', result.profile.id, result.profile.name, 'msa');
}

// Xoá cache token Microsoft — dùng khi người dùng bấm "Đăng xuất", để lần
// đăng nhập Microsoft kế tiếp bắt buộc phải xin mã mới thay vì âm thầm dùng
// lại refresh token cũ (đăng xuất thật sự, không chỉ xoá tài khoản đang hiển
// thị trong config như trước đây).
function logoutMicrosoft() {
  try {
    // const stats = fs.statSync(path.resolve(targetPath));
    // if (!stats.isFile() || !stats.isDirectory()) return;
    fs.rmSync(MSA_CACHE_DIR, { recursive: true, force: true });
  } catch (e) {
    console.error('[auth:logoutMicrosoft] Không thể xoá cache đăng nhập:', e?.message);
  }
}

function loginOffline(username = "Player") {
  username = String(username || '').trim();
  // Kiểm tra lại ở main process (không chỉ dựa vào validate phía renderer) —
  // renderer có thể bị bypass, nên IPC handler tự nó phải an toàn.
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
    throw new Error(i18n.t('auth.offlineInvalidUsername', currentLocale()));
  }

  return jsonData('offline', '', offlineUuidFor(username), username, 'mojang');
}


async function loginWithElyBy(login, password) {
  if (!login || !password) {
    throw new Error(i18n.t('auth.elybyMissingCredentials', currentLocale()));
  }

  let res;
  try {
    res = await getApiElyBy().authenticate(login, password);
  } catch (e) {
    throw new Error(i18n.t('auth.elybyNetworkError', currentLocale()));
  }

  let data = {};
  try { data = await res.json(); } catch (e) { /* body rỗng hoặc không phải JSON */ }

  if (!res.ok) {
    // ely.by trả lỗi dạng { error, errorMessage }. errorMessage đã là tiếng
    // Anh dễ hiểu (vd "Invalid credentials..."), nhưng vẫn kèm fallback.
    const message = data?.errorMessage || i18n.t('auth.elybyLoginFailed', currentLocale());
    throw new Error(message);
  }

  const profile = data.selectedProfile;
  if (!profile) {
    throw new Error(i18n.t('auth.elybyNoProfile', currentLocale()));
  }

  return jsonData(data.accessToken, data.clientToken, profile.id, profile.name, 'elyby');
}


module.exports = { loginWithMicrosoftAccount, loginWithMicrosoftAuthentication, logoutMicrosoft, loginOffline, loginWithElyBy };