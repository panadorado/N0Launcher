const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const profiles = require('./profiles')

const userDataDir = app.getPath('userData');
const configPath = path.join(userDataDir, '../.minecraft', 'launcher_config.json');

const defaultConfig = {
  root: path.join(userDataDir, '../.minecraft'),
  version: '26.2', // giữ lại để tương thích ngược, không còn dùng trực tiếp để launch
  memory: { min: 2048, max: 6144 },
  lastAccount: null,
  javaPath: null,
  profiles: [],
  lastProfileId: null,
  autoRecommendRam: false,
  customVersions: [],
  network: {
    useMirror: true,
    proxy: '',
  },
  updateCheck: {
    checkOnStartup: true,
    // Ghi lại phiên bản người dùng đã bấm "Để sau" để không hiện lại thông
    // báo cho ĐÚNG bản đó ở lần mở kế tiếp — nhưng vẫn cho kiểm tra lại thủ
    // công bất cứ lúc nào (nút "Kiểm tra cập nhật" trong Cài đặt bỏ qua cờ này).
    dismissedVersion: null,
  },
  locale: 'vi',
};

function migrateLegacyVersion(config) {
  if ((!config.profiles || config.profiles.length === 0) && config.version) {
    const { createProfileObject } = profiles;
    const legacyProfile = createProfileObject({
      name: 'Phiên bản mới nhất',
      loader: 'vanilla',
      gameVersion: config.version,
      loaderVersion: null,
      versionType: 'release',
    });
    config.profiles = [legacyProfile];
    config.lastProfileId = legacyProfile.id;
  }
  return config;
}

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf8');
        const merged = { ...defaultConfig, ...JSON.parse(data) };
        return migrateLegacyVersion(merged);
        }
    } catch (e) {
        console.error('Lỗi đọc config:', e);
    }
    return migrateLegacyVersion({ ...defaultConfig });
}

function saveConfig(config) {
    try {
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('Đã lưu config');
    } catch (e) {
        console.error('Lỗi lưu config:', e);
    }
}

module.exports = { loadConfig, saveConfig, configPath };
