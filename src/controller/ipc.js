const { ipcMain, dialog, shell } = require('electron');
const { loginWithMicrosoft, loginOffline, loginWithElyBy } = require('../core/auth');
const { loadConfig, saveConfig } = require('../core/config');
const { launchGame, getInstalledJavaMajorVersion, estimateRequiredJavaMajor } = require('../core/launcher');
const { cancelInstall } = require('../core/installer');
const { getFeaturedVersions } = require('../core/versions');
const { getLoaderVersionsFor, getVanillaVersions } = require('../core/modloaders');
const { listProfiles, addProfile, removeProfile, findProfile, ensureProfileDir, getProfileGameDir } = require('../core/profiles');
const { checkMirrorHealth } = require('../core/network');
const { listMods, setModEnabled, deleteMod, listResourcePacks } = require('../core/mods');

function registerIpcHandlers(mainWindow) {
  ipcMain.handle('auth:loginWithMicrosoft', () => loginWithMicrosoft());
  ipcMain.handle('auth:loginOffline', (_event, username) => loginOffline(username));
  ipcMain.handle('auth:loginWithElyBy', (_event, login, password) => loginWithElyBy(login, password));
  
  ipcMain.handle('config:load', () => loadConfig());
  ipcMain.handle('config:save', (_event, config) => saveConfig(config));
  
  ipcMain.handle('launcher:launchGame', async (_event, account, profileId) => {
    try {
      return await launchGame(account, profileId, (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('launcher:progress', progress);
        }
      });
    } catch (e) {
      console.error('[launchGame] Lỗi khi khởi chạy game:', e);

      if (e && e.name === 'AggregateError' && Array.isArray(e.errors) && e.errors.length) {
        // Gộp thông điệp của từng lỗi con (thường là lỗi tải file: ENOTFOUND,
        // ECONNRESET, timeout...) thành 1 chuỗi dễ đọc cho người dùng.
        const details = e.errors.map(sub => sub?.message || String(sub)).join('; ');
        throw new Error(
          `Không thể khởi chạy game do lỗi mạng khi tải file cần thiết (${e.errors.length} lỗi): ${details}. ` +
          `Vui lòng kiểm tra kết nối Internet, tắt tạm VPN/proxy, hoặc kiểm tra tường lửa/antivirus có đang chặn launcher không.`
        );
      }

      throw new Error(e?.message || 'Không thể khởi chạy game. Xem log ERROR mới nhất để biết chi tiết.');
    }
  });

  // Nút "Dừng tải" ở trang chủ: huỷ tác vụ tải (Forge/NeoForge/Fabric/
  // vanilla/thư viện phụ thuộc) đang chạy, nếu có.
  ipcMain.handle('launcher:cancelInstall', () => cancelInstall());

  // TÍNH NĂNG MỚI: "Kiểm tra mirror" ở Settings — ping thử các nguồn
  // tải chính + mirror dự phòng, trả về danh sách kèm trạng thái/độ trễ.
  ipcMain.handle('network:checkMirrors', () => checkMirrorHealth());

  // TÍNH NĂNG MỚI: quản lý Mods & Resource Packs (dùng @xmcl/mod-parser +
  // @xmcl/resourcepack) — xem src/core/mods.js.
  ipcMain.handle('mods:list', (_event, profileId) => listMods(profileId));
  ipcMain.handle('mods:setEnabled', (_event, profileId, file, enabled) => setModEnabled(profileId, file, enabled));
  ipcMain.handle('mods:delete', (_event, profileId, file) => deleteMod(profileId, file));
  ipcMain.handle('resourcepacks:list', (_event, profileId) => listResourcePacks(profileId));

  // Mở thư mục mods/ ngoài Explorer/Finder — tiện cho ai muốn kéo-thả file
  // mod thủ công thay vì phải tự tìm đường dẫn.
  ipcMain.handle('mods:openFolder', (_event, profileId) => {
    const config = loadConfig();
    const profile = findProfile(config, profileId);
    if (!profile) throw new Error('Không tìm thấy cấu hình này.');
    const dir = require('path').join(getProfileGameDir(config, profile), 'mods');
    require('fs').mkdirSync(dir, { recursive: true });
    return shell.openPath(dir);
  });

  // Danh sách tin tức/tính năng nổi bật theo version, dùng cho trang chủ.
  // Gộp danh sách nổi bật hard-code sẵn với các phiên bản người dùng đã tự
  // thêm (lưu bền trong config.customVersions — xem ghi chú lỗi cũ ở
  // src/core/versions.js).
  ipcMain.handle('versions:list', () => {
    const config = loadConfig();
    return [...getFeaturedVersions(), ...(config.customVersions || [])];
  });
  ipcMain.handle('versions:add', (_event, version) => {
    const config = loadConfig();
    config.customVersions = config.customVersions || [];
    const alreadyKnown =
      getFeaturedVersions().some(v => v.id === version.id) ||
      config.customVersions.some(v => v.id === version.id);
    if (!alreadyKnown) {
      config.customVersions.push(version);
      saveConfig(config);
    }
    return true;
  });

  // ---- Cấu hình (Profiles) ----
  ipcMain.handle('profiles:list', () => {
    const config = loadConfig();
    return listProfiles(config);
  });

  ipcMain.handle('profiles:create', (_event, profileInput) => {
    const config = loadConfig();
    const profile = addProfile(config, profileInput);
    // Tạo sẵn thư mục riêng (nếu là mod loader) để tránh xung đột mod ngay
    // từ lúc tạo cấu hình, không cần đợi tới lúc bấm Chơi.
    ensureProfileDir(config, profile);
    saveConfig(config);
    return profile;
  });

  ipcMain.handle('profiles:delete', (_event, profileId) => {
    const config = loadConfig();
    removeProfile(config, profileId);
    saveConfig(config);
    return true;
  });

  ipcMain.handle('profiles:openFolder', async (_event, profileId) => {
    const config = loadConfig();
    const profile = findProfile(config, profileId);
    const dir = ensureProfileDir(config, profile || { loader: 'vanilla' });
    await shell.openPath(dir);
    return true;
  });

  // ---- Danh sách phiên bản theo từng loader (dùng cho tab "Cấu hình mới") ----
  ipcMain.handle('modloaders:getGameVersions', () => getVanillaVersions());
  ipcMain.handle('modloaders:getLoaderVersions', (_event, loader, mcVersion) =>
    getLoaderVersionsFor(loader, mcVersion)
  );

  // ---- Kiểm tra Java (chủ động, không cần bấm "Chơi" mới biết) ----
  // Nếu có profileId, so sánh luôn với yêu cầu Java của phiên bản đó; nếu
  // không, chỉ trả về thông tin Java đã cài trên máy.
  ipcMain.handle('system:checkJava', async (_event, profileId) => {
    const config = loadConfig();
    const javaPath = config.javaPath || 'java';
    const installedMajor = await getInstalledJavaMajorVersion(javaPath);

    let requiredMajor = null;
    let gameVersion = null;
    if (profileId) {
      const profile = findProfile(config, profileId);
      if (profile) {
        gameVersion = profile.gameVersion;
        requiredMajor = estimateRequiredJavaMajor(profile.gameVersion);
      }
    }

    return {
      javaPath,
      installed: installedMajor !== null,
      installedMajor,
      requiredMajor,
      gameVersion,
      compatible: installedMajor !== null && (requiredMajor === null || installedMajor >= requiredMajor),
    };
  });

  // Mở dialog chọn thư mục hệ điều hành cho "Đường dẫn game".
  // Trả về null nếu người dùng bấm Huỷ, để renderer biết không thay đổi gì.
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Chọn thư mục cài đặt game',
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });
}

module.exports = { registerIpcHandlers };