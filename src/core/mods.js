const fs = require('fs');
const path = require('path');
const { readForgeMod, readFabricMod, readQuiltMod } = require('@xmcl/mod-parser');
const { readPackMetaAndIcon } = require('@xmcl/resourcepack');
const { loadConfig } = require('./config');
const { findProfile, getProfileGameDir } = require('./profiles');

function getProfileOrThrow(config, profileId) {
  const profile = findProfile(config, profileId);
  if (!profile) throw new Error('Không tìm thấy cấu hình (profile) này.');
  return profile;
}

function modsDir(config, profile) {
  return path.join(getProfileGameDir(config, profile), 'mods');
}

function resourcePacksDir(config, profile) {
  return path.join(getProfileGameDir(config, profile), 'resourcepacks');
}


async function readModMetadata(fullPath, loader) {
  const attempts = loader === 'fabric'
    ? [readFabricMod, readQuiltMod]
    : loader === 'forge' || loader === 'neoforge'
      ? [readForgeMod, readFabricMod]
      : [readForgeMod, readFabricMod, readQuiltMod];

  for (const reader of attempts) {
    try {
      const meta = await reader(fullPath);
      const first = Array.isArray(meta) ? meta[0] : meta;
      if (!first) continue;
      return {
        modid: first.modid || first.id || null,
        name: first.name || first.modid || first.id || null,
        version: first.version || null,
        description: typeof first.description === 'string' ? first.description : null,
      };
    } catch (e) {
      // thử reader tiếp theo
    }
  }
  return null;
}

// Liệt kê toàn bộ mod trong thư mục mods/ của 1 profile. File `.jar.disabled`
// (quy ước phổ biến của các launcher khác) được coi là mod đã tắt.
async function listMods(profileId) {
  const config = loadConfig();
  const profile = getProfileOrThrow(config, profileId);
  if (profile.loader === 'vanilla') return [];

  const dir = modsDir(config, profile);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => /\.jar(\.disabled)?$/i.test(f));
  const results = await Promise.all(files.map(async (file) => {
    const enabled = !/\.disabled$/i.test(file);
    const baseName = file.replace(/\.disabled$/i, '');
    const full = path.join(dir, file);

    let meta = null;
    try {
      meta = await readModMetadata(full, profile.loader);
    } catch (e) {
      meta = null;
    }

    let size = 0;
    try { size = fs.statSync(full).size; } catch (e) { /* bỏ qua */ }

    return {
      file,
      enabled,
      name: (meta && meta.name) || baseName.replace(/\.jar$/i, ''),
      modid: meta && meta.modid,
      version: meta && meta.version,
      description: meta && meta.description,
      size,
      unrecognized: !meta,
    };
  }));

  return results.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

// Bật/tắt 1 mod bằng cách đổi đuôi file — không xoá, để có thể bật lại.
function setModEnabled(profileId, file, enabled) {
  const config = loadConfig();
  const profile = getProfileOrThrow(config, profileId);
  const dir = modsDir(config, profile);

  const baseName = file.replace(/\.disabled$/i, '');
  const from = path.join(dir, file);
  const to = path.join(dir, enabled ? baseName : `${baseName}.disabled`);

  if (path.resolve(from) === path.resolve(to)) {
    return { file: path.basename(to), enabled };
  }
  if (!fs.existsSync(from)) throw new Error(`Không tìm thấy file mod: ${file}`);
  if (fs.existsSync(to)) throw new Error(`Đã tồn tại file trùng tên: ${path.basename(to)}`);

  fs.renameSync(from, to);
  return { file: path.basename(to), enabled };
}

// Xoá hẳn 1 mod khỏi thư mục mods/.
function deleteMod(profileId, file) {
  const config = loadConfig();
  const profile = getProfileOrThrow(config, profileId);
  const dir = modsDir(config, profile);
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) throw new Error(`Không tìm thấy file mod: ${file}`);
  fs.rmSync(full);
}

// Liệt kê resource pack (.zip) trong thư mục resourcepacks/ của 1 profile,
// kèm icon (pack.png, trả về dạng data URL để hiển thị trực tiếp trong UI)
// và mô tả từ pack.mcmeta.
async function listResourcePacks(profileId) {
  const config = loadConfig();
  const profile = getProfileOrThrow(config, profileId);
  const dir = resourcePacksDir(config, profile);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => /\.zip$/i.test(f));
  const results = await Promise.all(files.map(async (file) => {
    const full = path.join(dir, file);
    try {
      const { metadata, icon } = await readPackMetaAndIcon(full);
      const description = typeof metadata?.description === 'string'
        ? metadata.description
        : (metadata?.description ? JSON.stringify(metadata.description) : '');
      return {
        file,
        description,
        packFormat: metadata?.pack_format ?? null,
        icon: icon ? `data:image/png;base64,${Buffer.from(icon).toString('base64')}` : null,
      };
    } catch (e) {
      return { file, description: '', packFormat: null, icon: null, unrecognized: true };
    }
  }));

  return results.sort((a, b) => a.file.localeCompare(b.file, 'vi'));
}

module.exports = {
  listMods,
  setModEnabled,
  deleteMod,
  listResourcePacks,
};
