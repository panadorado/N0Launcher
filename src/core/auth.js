const { Auth, lexicon } = require("msmc");
const path = require('path');
const crypto = require('crypto');

function offlineUuidFor(username) {
  const hash = crypto.createHash('md5').update(`OfflinePlayer:${username}`, 'utf8').digest();
  hash[6] = (hash[6] & 0x0f) | 0x30; // đặt version = 3
  hash[8] = (hash[8] & 0x3f) | 0x80; // đặt variant theo RFC 4122
  const hex = hash.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function loginWithMicrosoft() {
  const authManager = new Auth("select_account");
  return await authManager.launch('electron', {
    width: 500,
    height: 650,
    resizable: false,
    autoHideMenuBar: true,
    title: "Đăng nhập Microsoft",
    icon: path.join(__dirname, '../assets/N0Launcher.png'),
  }).then(result => {
    return {
      access_token: result.mcToken,
      uuid: result.profile.id,
      name: result.profile.name,
      meta: { type: 'msa' }
    };
  })
  .catch(err => {
    const wrapped = lexicon.wrapError(err);
    if (wrapped.name === "error.gui.closed") {
      wrapped.message = 'Người dùng đã hủy đăng nhập!';
      throw new Error(wrapped.message);
    }
    else {
      console.error("[auth:loginWithMicrosoft] Login failed:", wrapped.name, wrapped.message);
      throw new Error(wrapped.message)
    }
  });
}

function loginOffline(username = "Player") {
  return {
    access_token: 'offline',
    uuid: offlineUuidFor(username),
    name: username,
    meta: { type: 'mojang' }
  };
}


async function loginWithElyBy(login, password) {
  if (!login || !password) {
    throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu ely.by.');
  }

  let res;
  try {
    res = await fetch(`https://authserver.ely.by/auth/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: { name: 'Minecraft', version: 1 },
        username: login,
        password: password,
        requestUser: true,
      }),
    });
  } catch (e) {
    throw new Error('Không thể kết nối tới ely.by. Vui lòng kiểm tra mạng và thử lại.');
  }

  let data = {};
  try { data = await res.json(); } catch (e) { /* body rỗng hoặc không phải JSON */ }

  if (!res.ok) {
    // ely.by trả lỗi dạng { error, errorMessage }. errorMessage đã là tiếng
    // Anh dễ hiểu (vd "Invalid credentials..."), nhưng vẫn kèm fallback.
    const message = data?.errorMessage || 'Đăng nhập ely.by thất bại. Vui lòng kiểm tra lại tài khoản/mật khẩu.';
    throw new Error(message);
  }

  const profile = data.selectedProfile;
  if (!profile) {
    throw new Error('Tài khoản ely.by này chưa có nhân vật Minecraft nào được liên kết.');
  }

  return {
    access_token: data.accessToken,
    client_token: data.clientToken,
    uuid: profile.id,
    name: profile.name,
    meta: { type: 'elyby' },
  };
}


module.exports = { loginWithMicrosoft, loginOffline, loginWithElyBy };