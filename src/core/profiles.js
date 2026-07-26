const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

const LOADER_LABELS = {
  vanilla: 'Vanilla',
  forge: 'Forge',
  neoforge: 'NeoForge',
  fabric: 'Fabric',
};

function slug(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'cau-hinh';
}

/**
 * Tạo object profile hoàn chỉnh (chưa lưu vào config).
 */
function createProfileObject({ name, loader, gameVersion, loaderVersion, versionType }) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const isVanilla = loader === 'vanilla';

  return {
    id,
    name: name || `${LOADER_LABELS[loader] || loader} ${gameVersion}`,
    loader, // 'vanilla' | 'forge' | 'neoforge' | 'fabric'
    gameVersion, // ví dụ '1.21.3'
    loaderVersion: isVanilla ? null : loaderVersion, // build/loader version, null cho vanilla
    // 'release' | 'snapshot' | 'modified' — dùng để lọc theo checkbox trên UI.
    // Bất kỳ loader nào khác vanilla đều được coi là "Đã sửa đổi".
    versionType: isVanilla ? (versionType || 'release') : 'modified',
    // Thư mục con TƯƠNG ĐỐI so với config.root, chỉ áp dụng cho mod loader.
    // Cấu trúc: mods/<loader>/<gameVersion>-<loaderVersion rút gọn>
    // => các cấu hình modded được tách thư mục theo loader + version để
    //    tránh xung đột file mod giữa Forge/NeoForge/Fabric hoặc giữa các
    //    phiên bản Minecraft khác nhau.
    dirName: isVanilla ? null : path.join('mods', loader, `${gameVersion}-${slug(loaderVersion || 'latest')}`),
    installedVersionId: null, // versionId thật sự dùng để launch (do @xmcl/installer trả về) sau khi cài xong
    icon: isVanilla ? 'vanilla' : loader,
    createdAt: Date.now(),
    lastPlayedAt: null,
  };
}

function listProfiles(config) {
  return Array.isArray(config.profiles) ? config.profiles : [];
}

function findProfile(config, profileId) {
  return listProfiles(config).find(p => p.id === profileId) || null;
}

function addProfile(config, profileInput) {
  const profile = createProfileObject(profileInput);
  config.profiles = [...listProfiles(config), profile];
  return profile;
}

function removeProfile(config, profileId) {
  config.profiles = listProfiles(config).filter(p => p.id !== profileId);
  if (config.lastProfileId === profileId) config.lastProfileId = null;
}

/**
 * Trả về đường dẫn thư mục game (tuyệt đối) sẽ dùng để launch cho 1 profile.
 * - Vanilla: dùng thẳng config.root (giữ hành vi cũ).
 * - Forge/NeoForge/Fabric: config.root/mods/<loader>/<version> — thư mục
 *   riêng biệt cho từng loader+version để mod của bản này không lẫn vào bản
 *   khác (ví dụ mods Forge 1.20.1 sẽ không nằm chung với mods Fabric 1.21.3).
 */
function getProfileGameDir(config, profile) {
  const root = path.resolve(config.root || path.join(app.getPath('userData'), 'minecraft'));
  if (!profile || profile.loader === 'vanilla' || !profile.dirName) return root;
  return path.join(root, profile.dirName);
}

function ensureProfileDir(config, profile) {
  const dir = getProfileGameDir(config, profile);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = {
  LOADER_LABELS,
  createProfileObject,
  listProfiles,
  findProfile,
  addProfile,
  removeProfile,
  getProfileGameDir,
  ensureProfileDir,
};
