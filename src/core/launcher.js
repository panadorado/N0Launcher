const { app } = require('electron');
const { Client } = require('minecraft-launcher-core');
const fs = require('fs');
const path = require('path');
const { Version } = require('@xmcl/core');
const { loadConfig, saveConfig } = require('./config');
const { findProfile, getProfileGameDir, ensureProfileDir } = require('./profiles');
const { installProfile, isCancelRequested } = require('./installer');
const { recommendRamMB } = require('./ram');
const { ensureJavaRuntime, guessJavaComponent, getInstalledJavaMajorVersion } = require('./javaManager');

let lastDebugMessage = '';
const launcher = new Client();

// URL xác thực ely.by — dùng làm tham số cho authlib-injector (xem
// ensureAuthlibInjector/buildAuthlibInjectorArg bên dưới).
const AUTHLIB_INJECTOR_API  = 'https://api.github.com/repos/yushijinhun/authlib-injector/releases/latest';
const ELYBY_AUTH_SERVER     = 'https://authserver.ely.by';
const ELYBY_SYST_SERVER     = 'http://skinsystem.ely.by';
const INJECTOR_JAR_NAME     = 'authlib-injector.jar';

const MODDED_JVM_COMPAT_ARGS = [
  '--add-opens', 'java.base/java.lang.invoke=ALL-UNNAMED',
  '--add-opens', 'java.base/java.util.jar=ALL-UNNAMED',
  '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
  '--add-exports', 'java.base/sun.security.util=ALL-UNNAMED',
];

function estimateRequiredJavaMajor(mcVersion) {
  const parts = String(mcVersion || '').split('.').map(n => parseInt(n, 10) || 0);
  const [major, minor = 0, patch = 0] = parts;

  if (major >= 20) return 21;

  if (major !== 1) return 8;
  if (minor > 20 || (minor === 20 && patch >= 5)) return 21; // 1.20.5+
  if (minor >= 18) return 17; // 1.18 - 1.20.4
  if (minor >= 17) return 16; // 1.17.x
  return 8; // <= 1.16.5
}

// Minecraft/Forge trước 1.13 khởi động qua net.minecraft.launchwrapper.Launch,
// vốn ép kiểu system classloader về java.net.URLClassLoader — cách này VỠ
// HẲN trên Java 9+ (JDK 9 đổi AppClassLoader mặc định, không còn kế thừa
// URLClassLoader nữa), ném ClassCastException ngay khi khởi động, không phải
// lỗi "thiếu tính năng" có thể bỏ qua. Vì vậy các bản này bắt buộc CHÍNH XÁC
// Java 8 — không chỉ "Java 8 trở lên" như các version khác — kể cả khi máy
// đã có sẵn Java mới hơn (17/21/25...) vẫn phải dùng đúng Java 8.
// Trả về null nếu không có giới hạn trên (Java mới hơn vẫn dùng được).
function estimateMaxCompatibleJavaMajor(mcVersion) {
  const parts = String(mcVersion || '').split('.').map(n => parseInt(n, 10) || 0);
  const [major, minor = 0] = parts;
  if (major === 1 && minor < 13) return 8;
  return null;
}

async function getAuthlibInjectorDownloadUrl() {
  const res = await fetch(AUTHLIB_INJECTOR_API, {
    headers: { 'User-Agent': 'Minecraft-Launcher' },
    signal: AbortSignal.timeout(15_000), // 15 giây — tránh treo vô hạn nếu mạng lỗi
  });

  if (!res.ok) throw new Error('Không thể lấy thông tin release mới nhất');

  const data = await res.json();
  
  // Lấy asset JAR
  const asset = data.assets.find(a => a.name.endsWith('.jar'));
  
  if (!asset) throw new Error('Không tìm thấy file JAR trong release');

  return {
    version: data.tag_name,           // ví dụ: v1.2.8
    downloadUrl: asset.browser_download_url,
    fileName: asset.name
  };
}

async function ensureAuthlibInjector(gameDir) {
  const jarPath = path.join(gameDir, INJECTOR_JAR_NAME);

  await fs.promises.mkdir(gameDir, { recursive: true });

  // Kiểm tra đã có file chưa
  if (await fileExists(jarPath)) return jarPath;

  console.log('Đang lấy thông tin authlib-injector mới nhất...');

  const { downloadUrl, version, fileName } = await getAuthlibInjectorDownloadUrl();
  
  console.log(`Tìm thấy phiên bản ${version}, đang tải ${fileName}...`);

  const res = await fetch(downloadUrl, {
    signal: AbortSignal.timeout(60_000), // 60 giây
  });

  if (!res.ok) throw new Error(`Tải thất bại: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());

  await fs.promises.writeFile(jarPath, buffer);
  
  console.log(`✅ Đã tải authlib-injector ${version} thành công`);
  return jarPath;
}

// Helper nhỏ
async function fileExists(path) {
  try {
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Xóa file trong thư mục game
 * @param {string} gameDir - Thư mục game (game directory)
 * @param {string} fileName - Tên file cần xóa
 * @returns {Promise<boolean>} - true nếu xóa thành công, false nếu file không tồn tại
 */
async function deleteFile(gameDir, fileName) {
  const filePath = path.join(gameDir, fileName);

  try {
    // Kiểm tra file có tồn tại không
    await fs.promises.access(filePath);
    
    await fs.promises.unlink(filePath);
    console.log(`✅ Đã xóa file: ${fileName}`);
    return true;

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`ℹ️ File không tồn tại: ${fileName}`);
      return false; // File không tồn tại cũng coi là "xong"
    }
    
    console.error(`❌ Lỗi khi xóa file ${fileName}:`, error.message);
    throw error; // Throw lỗi thật nếu có vấn đề khác (permission, etc.)
  }
}

function getMclcHandlerClass() {
  const cacheKey = Object.keys(require.cache).find((key) => {
    const normalized = key.replace(/\\/g, '/');
    return normalized.includes('minecraft-launcher-core') && normalized.endsWith('/handler.js');
  });
  return cacheKey ? require.cache[cacheKey].exports : null;
}

const Handler = getMclcHandlerClass();

if (Handler) {
  const originalGetAssets = Handler.prototype.getAssets;

  const countAssetObjects = (assetDirectory) => {
    const objectsDir = path.join(assetDirectory, 'objects');
    if (!fs.existsSync(objectsDir)) return 0;
    let total = 0;
    for (const sub of fs.readdirSync(objectsDir)) {
      const subPath = path.join(objectsDir, sub);
      try {
        if (fs.statSync(subPath).isDirectory()) {
          total += fs.readdirSync(subPath).length;
        }
      } catch (e) {
        console.log(e?.message)
      }
    }
    return total;
  };

  Handler.prototype.getAssets = async function patchedGetAssets(...args) {
    const assetDirectory = path.resolve(this.options.overrides.assetRoot || path.join(this.options.root, 'assets'));
    const assetId = this.options.version.custom || this.options.version.number;
    const indexPath = path.join(assetDirectory, 'indexes', `${assetId}.json`);
    const markerPath = path.join(assetDirectory, '.n0-verified', `${assetId}.json`);

    if (fs.existsSync(markerPath) && fs.existsSync(indexPath)) {
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
        const expectedCount = Object.keys(index.objects).length;
        const actualCount = countAssetObjects(assetDirectory);

        if (marker.expectedCount === expectedCount && actualCount >= expectedCount) {
          this.client.emit('debug', `[N0] Assets '${assetId}' đã được xác thực đầy đủ ở lần chơi trước (${actualCount}/${expectedCount} file) — bỏ qua so khớp SHA1 từng file, chỉ so sánh số lượng.`);
          this.client.emit('progress', { type: 'assets', task: expectedCount, total: expectedCount });
          return;
        }
        this.client.emit('debug', `[N0] Số lượng asset không khớp (${actualCount}/${expectedCount}) — xác thực lại đầy đủ.`);
      } catch (e) {
        console.log(e?.message)
      }
    }

    await originalGetAssets.apply(this, args);

    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      fs.mkdirSync(path.dirname(markerPath), { recursive: true });
      fs.writeFileSync(markerPath, JSON.stringify({
        expectedCount: Object.keys(index.objects).length,
        verifiedAt: new Date().toISOString(),
      }));
    } catch (e) {}
  };
} else {
  console.warn('[N0] Không tìm thấy Handler nội bộ của minecraft-launcher-core trong require.cache — bỏ qua patch tối ưu xác thực asset (không ảnh hưởng chức năng chính).');
}

function attachProgressListeners(onProgress) {

  launcher.removeAllListeners('progress');
  launcher.removeAllListeners('download-status');
  launcher.removeAllListeners('close');
  launcher.removeAllListeners('data');
  launcher.removeAllListeners('debug');

  launcher.on('debug', (msg) => {
    lastDebugMessage = msg;
    console.log(msg);
  });

  launcher.on('download-status', (e) => {
    const current = e.current ?? 0;
    const total = e.total || 0;
    const percent = total ? Math.min(100, Math.round((current / total) * 100)) : 0;
    onProgress({
      phase: 'downloading',
      percent,
      label: `Đang tải xuống (${e.type || 'dữ liệu'})... ${current}/${total}`
    });
  });

  // Sự kiện giải nén (natives, v.v.) — event này dùng đúng field 'task'/'total'
  launcher.on('progress', (e) => {
    const task = e.task ?? 0;
    const total = e.total || 0;
    const percent = total ? Math.min(100, Math.round((task / total) * 100)) : 0;
    onProgress({
      phase: 'extracting',
      percent,
      label: `Đang giải nén (${e.type || 'tệp'})... ${task}/${total}`
    });
  });

  launcher.on('data', (data) => {
    console.log('[Minecraft]', data);
    onProgress({ phase: 'running', label: 'Trò chơi đang chạy...' });
  });

  // Game đã đóng — log kèm mã thoát để phân biệt đóng bình thường (code 0)
  // với crash (code khác 0, hoặc null nếu bị kill).
  launcher.on('close', (code) => {
    console.log(`[MCLC]: Minecraft đã thoát với mã: ${code}`);
    onProgress({ phase: 'closed', code, label: 'Đã đóng trò chơi.' });
  });
}

/**
 * Khởi chạy game theo 1 profile cụ thể (Vanilla/Forge/NeoForge/Fabric).
 * @param {object} account tài khoản đã đăng nhập
 * @param {string} profileId id của profile trong config.profiles
 */
async function launchGame(account, profileId, onProgress = () => {}) {
  const config = loadConfig();
  const profile = findProfile(config, profileId);

  if (!profile) throw new Error('Không tìm thấy cấu hình đã chọn. Vui lòng chọn lại phiên bản.');

  const gameDir = ensureProfileDir(config, profile);

  onProgress({ phase: 'preparing', percent: 0, label: 'Đang chuẩn bị khởi chạy...' });

  const versionId = await installProfile(profile, gameDir, onProgress);

  if (profile.installedVersionId !== versionId) {
    profile.installedVersionId = versionId;
    profile.lastPlayedAt = Date.now();
    saveConfig(config);
  }

  let requiredJavaMajor = null;
  let requiredJavaComponent = null;
  try {
    const resolvedVersion = await Version.parse(gameDir, versionId);
    requiredJavaMajor = resolvedVersion.javaVersion?.majorVersion || null;
    requiredJavaComponent = resolvedVersion.javaVersion?.component || null;
  } catch (e) {}
  
  if (!requiredJavaMajor) {
    requiredJavaMajor = estimateRequiredJavaMajor(profile.gameVersion);
  }
  // Giới hạn TRÊN (nếu có) — riêng cho các bản Forge/Minecraft cũ dùng
  // LaunchWrapper, vốn không chạy được trên Java quá mới dù máy đã có sẵn.
  // Không lấy từ version JSON vì trường này Mojang không công bố "max" —
  // chỉ tự suy luận theo gameVersion.
  const maxCompatibleJavaMajor = estimateMaxCompatibleJavaMajor(profile.gameVersion);

  let javaPathForLaunch = config.javaPath || undefined;

  if (requiredJavaMajor) {
    const javaPathToCheck = config.javaPath || 'java';
    const installedJavaMajor = await getInstalledJavaMajorVersion(javaPathToCheck);

    const tooOld = !installedJavaMajor || installedJavaMajor < requiredJavaMajor;
    const tooNew = installedJavaMajor && maxCompatibleJavaMajor != null && installedJavaMajor > maxCompatibleJavaMajor;

    if (tooOld || tooNew) {
      if (config.javaPath) {
        throw new Error(
          tooNew
            ? `Java tại "${config.javaPath}" không tương thích: phiên bản Minecraft "${profile.gameVersion}" dùng LaunchWrapper, CHỈ chạy được với đúng Java ${maxCompatibleJavaMajor}, không chạy được với Java ${installedJavaMajor} đang trỏ tới (sẽ báo lỗi ClassCastException khi khởi động). Vui lòng đổi đường dẫn Java sang bản Java ${maxCompatibleJavaMajor}, hoặc xoá trắng ô đó để launcher tự tải Java phù hợp.`
            : `Java tại "${config.javaPath}" không tương thích: phiên bản Minecraft "${profile.gameVersion}" yêu cầu Java ${requiredJavaMajor} trở lên. Vui lòng sửa lại đường dẫn Java trong Cài đặt, hoặc xoá trắng ô đó để launcher tự động tải Java phù hợp.`
        );
      }

      const component = requiredJavaComponent || guessJavaComponent(requiredJavaMajor);
      onProgress({ phase: 'installing', percent: 0, label: `Java hệ thống không tương thích, đang tải Java ${requiredJavaMajor}...` });
      // Truyền requiredJavaMajor để ensureJavaRuntime tự phát hiện trường hợp
      // component NÀY đã cài trước đó nhưng là bản Java cũ không đủ yêu cầu
      // (vd Mojang cập nhật nội dung "java-runtime-delta" sang Java mới hơn
      // theo thời gian) — thay vì cứ dùng mãi bản cũ rồi báo lỗi launch.
      javaPathForLaunch = await ensureJavaRuntime(component, onProgress, requiredJavaMajor);
    }
  }

  const versionTypeForLaunch = profile.loader === 'vanilla' ? (profile.versionType === 'snapshot' ? 'snapshot' : 'release') : 'release';

  let customArgs = [];

  if (profile.loader !== 'vanilla') {
    if(requiredJavaMajor !== 8) customArgs.push(...MODDED_JVM_COMPAT_ARGS);
    customArgs.push(`-DlibraryDirectory=${path.join(gameDir, 'libraries')}`);
  }

  if (account?.meta?.type === 'elyby') {
    try {

      const userDataDir = app.getPath('userData');
      const injectorPath = await ensureAuthlibInjector(userDataDir);

      customArgs.push(
        `-javaagent:${injectorPath}=${ELYBY_AUTH_SERVER}`,
        `-Dauthlibinjector.yggdrasil.authserver=${ELYBY_AUTH_SERVER}`,
        `-Dauthlibinjector.yggdrasil.api=${ELYBY_AUTH_SERVER}`,
        `-Dauthlibinjector.skin.host=${ELYBY_SYST_SERVER}`,
        `-Dminecraft.accessToken=${account?.access_token}`,
        `-Dminecraft.uuid=${account?.uuid?.replace(/-/g, '')}`,
        `-Dminecraft.username=${account?.name}`
      );

    } catch (e) {
      console.error('[launcher] Không thể chuẩn bị authlib-injector cho ely.by:', e.message);
      throw new Error(`Không thể chuẩn bị xác thực ely.by (authlib-injector): ${e.message}. Vui lòng kiểm tra kết nối mạng rồi thử lại.`);
    }
  }

  const effectiveMaxMB = config.autoRecommendRam ? recommendRamMB(profile) : config.memory.max;
  const effectiveMinMB = Math.min(config.memory.min, effectiveMaxMB);

  const opts = {
    root: gameDir,
    version: profile.loader === 'vanilla'
      ? { number: profile.gameVersion, type: versionTypeForLaunch }
      : { number: profile.gameVersion, type: versionTypeForLaunch, custom: versionId },
    memory: {
      max: effectiveMaxMB + "M",
      min: effectiveMinMB + "M"
    },
    javaPath: javaPathForLaunch,
    authorization: account, ...(customArgs ? { customArgs } : {}),
    overrides: {
      detached: false
    }
  };

  attachProgressListeners(onProgress);
  lastDebugMessage = '';

  if (isCancelRequested()) {
    throw new Error('Đã dừng tải theo yêu cầu.');
  }

  console.log(`🚀 Đang khởi động game (${profile.name} — ${profile.loader}) tại: ${gameDir}`);

  const gameProcess = await launcher.launch(opts);

  if (!gameProcess) {
    throw new Error(
      lastDebugMessage
        ? `Không thể khởi chạy game: ${lastDebugMessage}`
        : 'Không thể khởi chạy game. Vui lòng kiểm tra đã cài Java (JDK) phù hợp với phiên bản Minecraft này, và xem log console để biết chi tiết.'
    );
  }

  onProgress({ phase: 'launched', percent: 100, label: 'Khởi chạy trò chơi!' });
}

module.exports = {
  launchGame,
  deleteFile,
  getInstalledJavaMajorVersion,
  estimateRequiredJavaMajor,
};