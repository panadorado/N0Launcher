import { getPages } from './pages/index.js';
import { renderProfileRow, renderEmptyState } from './pages/version.js';
import { renderModsBody } from './pages/mods.js';
import auth from './components/authUI.js';
import { recommendRamMB } from './utils/ram.js';
import { escapeHtml } from './utils/html.js';
import { t, setLocale } from './i18n/index.js';
import { version } from '../../../package.json'

const {
  loginWithMicrosoftAccount,
  loginWithMicrosoftAuthentication,
  logoutMicrosoft,
  onMicrosoftDeviceCode,
  openMicrosoftLoginPage,
  loginOffline,
  loginWithElyBy,
  launchGame,
  cancelInstall,
  loadConfig,
  saveConfig,
  getVersionList,
  addVersion,
  onLauncherProgress,
  selectFolder,
  listProfiles,
  createProfile,
  deleteProfile,
  openProfileFolder,
  getGameVersions,
  getLoaderVersions,
  checkJava,
  checkMirrors,
  listMods,
  setModEnabled,
  deleteMod,
  listResourcePacks,
  openModsFolder,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  isPortableBuild,
  getAppVersion,
  onUpdateStatus,
} = window.api;

let currentAccount = null;
let config = null;
let isLaunching = false;

let cancelRequestedByUser = false;

// ---- Đăng nhập Microsoft (device code) ----
let msaLoginInProgress = false;
let msaLoginAbandoned = false; // true khi người dùng bấm "Huỷ" trên modal
let currentMsaDeviceCode = null;

onMicrosoftDeviceCode((deviceCode) => {
  currentMsaDeviceCode = deviceCode;
  const codeEl = document.getElementById('msa-device-code');
  if (codeEl) codeEl.textContent = deviceCode.userCode || '------';
});

// ---- Kiểm tra & tải bản cập nhật ----
let latestUpdateInfo = null; // { version } — set khi có bản 'available'/'downloaded'

function setUpdateBanner({ title, desc, actionsHtml, percent }) {
  const banner = document.getElementById('update-banner');
  if (!banner) return;
  banner.classList.add('show');
  const titleEl = document.getElementById('update-banner-title');
  const descEl = document.getElementById('update-banner-desc');
  const actionsEl = document.getElementById('update-banner-actions');
  const progressWrap = document.getElementById('update-banner-progress-wrap');
  const progressFill = document.getElementById('update-banner-progress-fill');
  if (titleEl) titleEl.textContent = title || '';
  if (descEl) descEl.textContent = desc || '';
  if (actionsEl) actionsEl.innerHTML = actionsHtml || '';
  if (progressWrap) progressWrap.classList.toggle('show', percent !== undefined);
  if (progressFill && percent !== undefined) progressFill.style.width = Math.max(0, Math.min(100, percent)) + '%';
}

function setUpdateSettingsStatus(html) {
  const box = document.getElementById('update-status');
  if (box) box.innerHTML = html;
}

onUpdateStatus((status) => {
  if (status.status === 'checking') {
    setUpdateSettingsStatus('Đang kiểm tra cập nhật...');
  } else if (status.status === 'not-available') {
    setUpdateSettingsStatus('<span class="status-success"><i class="fas fa-circle-check"></i> Bạn đang dùng bản mới nhất.</span>');
  } else if (status.status === 'available') {
    latestUpdateInfo = status;
    setUpdateSettingsStatus(`<span class="status-info"><i class="fas fa-circle-info"></i> Có bản cập nhật mới v${escapeHtml(status.version)}.</span>`);
    if (config?.updateCheck?.dismissedVersion === status.version) return; // đã "Để sau" cho đúng bản này
    setUpdateBanner({
      title: `Có bản cập nhật mới: v${status.version}`,
      desc: 'Bạn có muốn tải và cài đặt ngay bây giờ không?',
      actionsHtml: `
        <button onclick="window.downloadUpdateUI()" class="btn-update-primary">Cập nhật ngay</button>
        <button onclick="window.dismissUpdateBanner(true)" class="btn-update-secondary">Để sau</button>
      `,
    });
  } else if (status.status === 'downloading') {
    setUpdateBanner({
      title: `Đang tải bản cập nhật${latestUpdateInfo?.version ? ' v' + latestUpdateInfo.version : ''}...`,
      desc: `${status.percent}%`,
      actionsHtml: '',
      percent: status.percent,
    });
    setUpdateSettingsStatus(`Đang tải... ${status.percent}%`);
  } else if (status.status === 'downloaded') {
    setUpdateBanner({
      title: 'Đã tải xong bản cập nhật!',
      desc: 'Khởi động lại để hoàn tất cài đặt.',
      actionsHtml: `<button onclick="window.installUpdateUI()" class="btn-update-primary">Khởi động lại &amp; Cài đặt</button>`,
    });
    setUpdateSettingsStatus('<span class="status-success"><i class="fas fa-circle-check"></i> Đã tải xong — khởi động lại để cài đặt.</span>');
  } else if (status.status === 'error') {
    console.error('[update]', status.message);
    setUpdateSettingsStatus(`<span class="status-error"><i class="fas fa-circle-xmark"></i> ${escapeHtml(status.message)}</span>`);
  }
});

window.checkForUpdatesUI = async function() {
  setUpdateSettingsStatus('Đang kiểm tra...');
  try {
    const portable = await isPortableBuild();
    if (portable) {
      setUpdateSettingsStatus('<span class="status-info"><i class="fas fa-circle-info"></i> Bản portable không hỗ trợ tự động cập nhật — vui lòng tải bản cài đặt mới nhất thủ công từ trang phát hành.</span>');
      return;
    }
    const res = await checkForUpdates();
    if (!res.ok) setUpdateSettingsStatus(`<span class="status-error"><i class="fas fa-circle-xmark"></i> ${escapeHtml(res.error)}</span>`);
  } catch (e) {
    setUpdateSettingsStatus(`<span class="status-error"><i class="fas fa-circle-xmark"></i> ${escapeHtml(e?.message)}</span>`);
  }
};

window.downloadUpdateUI = async function() {
  setUpdateBanner({ title: 'Đang chuẩn bị tải...', desc: '', actionsHtml: '', percent: 0 });
  try {
    const res = await downloadUpdate();
    if (!res.ok) {
      setUpdateBanner({ title: 'Không thể tải bản cập nhật', desc: res.error, actionsHtml: `<button onclick="window.downloadUpdateUI()" class="btn-update-secondary">Thử lại</button>` });
    }
  } catch (e) {
    setUpdateBanner({ title: 'Không thể tải bản cập nhật', desc: e?.message || '', actionsHtml: '' });
  }
};

window.installUpdateUI = async function() {
  await installUpdate();
};

// Đóng banner. `remember=true` (nút "Để sau") ghi nhớ phiên bản đã bỏ qua để
// không hỏi lại đúng bản đó ở lần mở kế tiếp — nhưng "Kiểm tra cập nhật" thủ
// công trong Cài đặt vẫn luôn hoạt động bất kể cờ này.
window.dismissUpdateBanner = async function(remember) {
  document.getElementById('update-banner')?.classList.remove('show');
  if (remember && latestUpdateInfo?.version) {
    config = await loadConfig();
    config.updateCheck = config.updateCheck || {};
    config.updateCheck.dismissedVersion = latestUpdateInfo.version;
    await saveConfig(config);
  }
};

// Cache trong bộ nhớ renderer, tránh gọi lại IPC mỗi lần gõ tìm kiếm/lọc.
let profilesCache = [];
let gameVersionsCache = null; // { release: [...], snapshot: [...] }
let activeLoaderTab = 'vanilla';

// ---- Thanh tiến trình (giống launcher Minecraft) ----
// ---- Thanh tiến trình ----
function showProgress(label, percent) {
  const container = document.getElementById('progress-container');
  const labelEl = document.getElementById('progress-label');
  const percentEl = document.getElementById('progress-percent');
  const fillEl = document.getElementById('progress-fill');

  if (!container) return;

  container.classList.add('show');
  if (labelEl) labelEl.textContent = label;
  const clamped = Math.max(0, Math.min(100, percent ?? 0));
  if (percentEl) percentEl.textContent = clamped + '%';
  if (fillEl) fillEl.style.width = clamped + '%';
}

function hideProgress() {
  const container = document.getElementById('progress-container');
  if (container) container.classList.remove('show');
}

function setPlayButtonMode(mode) {
  const btn = document.getElementById('play-main-btn');
  const icon = document.getElementById('play-btn-icon');
  const text = document.getElementById('play-btn-text');
  if (!btn) return;

  btn.disabled = false;

  if (mode === 'cancel') {
    btn.onclick = () => window.cancelDownload();
    btn.classList.remove('mode-normal');
    btn.classList.add('mode-cancel');
    if (icon) icon.className = 'fas fa-stop';
    if (text) text.textContent = 'Dừng tải';
  } else {
    btn.onclick = () => window.startGame();
    btn.classList.remove('mode-cancel');
    btn.classList.add('mode-normal');
    if (icon) icon.className = 'fas fa-play';
    if (text) text.textContent = 'Bắt đầu';
  }
}

// Lắng nghe tiến trình (giữ nguyên logic)
onLauncherProgress((data) => {
  if (['preparing', 'installing', 'downloading', 'extracting'].includes(data.phase)) {
    showProgress(data.label, data.percent);
    setPlayButtonMode('cancel');
  } else if (data.phase === 'launched') {
    showProgress(data.label, 100);
    setPlayButtonMode('normal');
    setTimeout(hideProgress, 1500);
  } else if (data.phase === 'cancelled' || data.phase === 'closed') {
    hideProgress();
    setPlayButtonMode('normal');
    isLaunching = false;
  }
});

function findLastProfile() {
  if (!config?.lastProfileId) return null;
  return profilesCache.find(p => p.id === config.lastProfileId) || null;
}

// Chuyển trang
let currentPageName = 'home';

window.showPage = async function(page) {
  currentPageName = page;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn =>
    btn.getAttribute('onclick')?.includes(page)
  );
  if (activeBtn) activeBtn.classList.add('active');

  const content = document.getElementById('content');
  const renderPage = getPages(page);

  if (!renderPage) {
    console.error(`Không tìm thấy trang: ${page}`);
    return;
  }

  // Cập nhật nút Auth
  const authBtn = document.querySelector('#auth-btn');
  const authIcon = document.querySelector('#auth-icon');
  const authText = document.querySelector('#auth-btn span');

  if (currentAccount) {
    authIcon.className = 'fas fa-right-from-bracket';
    authBtn.classList.remove('mode-login');
    authBtn.classList.add('mode-logout');
    authText.innerHTML = escapeHtml(currentAccount.name);
    authBtn.onclick = async () => await logout();
  } else {
    authIcon.className = 'fas fa-user';
    authBtn.classList.remove('mode-logout');
    authBtn.classList.add('mode-login');
    authText.innerHTML = t('common.login');
    authBtn.onclick = () => showPage('login');
  }

  if (page === 'home') {
    profilesCache = await listProfiles();
    content.innerHTML = await renderPage(currentAccount, config, getVersionList, findLastProfile());
  }
  else if (page === 'versions') {
    content.innerHTML = await renderPage();
    await window.refreshProfilesList();
  }
  else if (page === 'settings') {
    profilesCache = profilesCache.length ? profilesCache : await listProfiles();
    content.innerHTML = await renderPage(config, findLastProfile());
    const versionLabel = document.getElementById('app-version-label');
    if (versionLabel) versionLabel.textContent = await getAppVersion();
  }
  else if (page === 'login') {
    content.innerHTML = await renderPage(currentAccount, auth);
  }
  else if (page === 'mods') {
    profilesCache = profilesCache.length ? profilesCache : await listProfiles();
    const modded = profilesCache.filter(p => p.loader !== 'vanilla');
    const preferredId = config?.lastProfileId && modded.some(p => p.id === config.lastProfileId)
      ? config.lastProfileId
      : (modded[0]?.id || null);
    let bodyHtml = '';
    if (preferredId) {
      const [mods, packs] = await Promise.all([listMods(preferredId), listResourcePacks(preferredId)]);
      bodyHtml = renderModsBody(preferredId, mods, packs);
    }
    content.innerHTML = renderPage(profilesCache, preferredId, bodyHtml);
  }
};

window.showDialog = function(rawMessage) {

  if (!rawMessage) return "Đã xảy ra lỗi không xác định";

  let msg = typeof rawMessage === "string" ? rawMessage : (rawMessage.message ?? String(rawMessage));

  // Bỏ phần "Error invoking remote method 'xxx': " (Electron tự thêm vào)
  msg = msg.replace(/Error invoking remote method '[^']*':\s*/g, "");

  // Bỏ các tiền tố "Error: " lặp lại nhiều lớp (Error: Error: Error: ...)
  msg = msg.replace(/^(Error:\s*)+/g, "");

  // Phòng trường hợp còn sót dấu ":" hoặc khoảng trắng thừa ở đầu/cuối
  msg = msg.trim().replace(/^:\s*/, "");

  const errorBox = document.getElementById("login-error");
  const errorText = document.getElementById("login-error-text");
  if (!errorBox || !errorText) return;

  errorText.textContent = msg;

  // Hiện lỗi
  errorBox.classList.add("show");

  // Re-trigger shake animation mỗi lần có lỗi mới
  errorBox.classList.remove("shake");
  void errorBox.offsetWidth; // force reflow
  errorBox.classList.add("shake");
};

// Hàm đóng lỗi (nếu chưa có)
window.dismissLoginError = function() {
  const errorBox = document.getElementById("login-error");
  if (errorBox) errorBox.classList.remove("show", "shake");
};

// ===================== Cấu hình (Profiles) =====================

// Lọc + sắp xếp + render lại danh sách cấu hình theo trạng thái các control
// (ô tìm kiếm, dropdown sắp xếp, 3 checkbox lọc Phát hành/Bản thử nghiệm/Đã
// sửa đổi) — tương tự bộ lọc trong ảnh mẫu.
window.refreshProfilesList = async function() {
  const listEl = document.getElementById('profiles-list');
  if (!listEl) return;

  profilesCache = await listProfiles();

  const search = (document.getElementById('profile-search')?.value || '').toLowerCase().trim();
  const sortBy = document.getElementById('profile-sort')?.value || 'name';
  const showRelease = document.getElementById('filter-release')?.checked ?? true;
  const showSnapshot = document.getElementById('filter-snapshot')?.checked ?? true;
  const showModified = document.getElementById('filter-modified')?.checked ?? true;

  let filtered = profilesCache.filter(p => {
    if (p.versionType === 'release' && !showRelease) return false;
    if (p.versionType === 'snapshot' && !showSnapshot) return false;
    if (p.versionType === 'modified' && !showModified) return false;
    if (search) {
      const haystack = `${p.name} ${p.gameVersion} ${p.loader} ${p.loaderVersion || ''}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'version') return (a.gameVersion || '').localeCompare(b.gameVersion || '', undefined, { numeric: true });
    if (sortBy === 'created') return (b.createdAt || 0) - (a.createdAt || 0);
    return (a.name || '').localeCompare(b.name || '');
  });

  listEl.innerHTML = filtered.length
    ? filtered.map(renderProfileRow).join('')
    : renderEmptyState();
};

window.toggleProfileMenu = function(id) {
  // Đóng tất cả menu khác
  document.querySelectorAll('[id^="menu-"]').forEach(el => {
    if (el.id !== `menu-${id}`) {
      el.classList.remove('show');
    }
  });

  // Bật/tắt menu hiện tại
  document.getElementById(`menu-${id}`)?.classList.toggle('show');
};

window.deleteProfileUI = async function(id) {
  await deleteProfile(id);
  // Đồng bộ lại bản sao config trong renderer (main process vừa tự sửa file
  // config khi xoá cấu hình) để các lần saveConfig(config) sau này (đổi
  // phiên bản, lưu settings...) không lưu đè bằng danh sách cũ.
  config = await loadConfig();
  await window.refreshProfilesList();
};

window.openProfileFolderUI = async function(id) {
  await openProfileFolder(id);
};

// ===================== Modal "Cấu hình mới" =====================

window.openNewProfileModal = function() {
  document.getElementById('new-profile-modal')?.classList.add('show');
  window.switchProfileTab('vanilla');
};

window.closeNewProfileModal = function() {
  document.getElementById('new-profile-modal')?.classList.remove('show');

  const err = document.getElementById('new-profile-error');
  if (err) err.classList.remove('show');

  const nameInput = document.getElementById('new-profile-name');
  if (nameInput) nameInput.value = '';
};

window.switchProfileTab = function(loader) {
  activeLoaderTab = loader;

  // Ẩn tất cả panel
  document.querySelectorAll('.loader-panel').forEach(el => {
    el.classList.remove('show');
  });
  // Hiện panel đang chọn
  document.getElementById(`panel-${loader}`)?.classList.add('show');

  // Cập nhật trạng thái tab
  document.querySelectorAll('.profile-tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === loader;
    btn.classList.toggle('active', isActive);
  });

  // Tải danh sách version
  if (loader === 'vanilla') window.reloadVanillaVersions();
  if (loader === 'forge') window.ensureForgeMcOptions();
  if (loader === 'neoforge') window.ensureNeoForgeMcOptions();
  if (loader === 'fabric') window.ensureFabricMcOptions();
};

async function ensureGameVersionsLoaded() {
  if (gameVersionsCache) return gameVersionsCache;
  const all = await getGameVersions();
  gameVersionsCache = {
    release: all.filter(v => v.type === 'release').map(v => v.id),
    snapshot: all.filter(v => v.type === 'snapshot').map(v => v.id),
  };
  return gameVersionsCache;
}

window.reloadVanillaVersions = async function() {
  const select = document.getElementById('vanilla-version-select');
  if (!select) return;
  select.innerHTML = `<option>Đang tải danh sách...</option>`;

  const versions = await ensureGameVersionsLoaded();
  const showRelease = document.getElementById('vanilla-show-release')?.checked ?? true;
  const showSnapshot = document.getElementById('vanilla-show-snapshot')?.checked ?? false;

  const ids = [
    ...(showRelease ? versions.release : []),
    ...(showSnapshot ? versions.snapshot : []),
  ];

  select.innerHTML = ids.length
    ? ids.map(id => `<option value="${id}">${id}</option>`).join('')
    : `<option value="">Không có phiên bản phù hợp</option>`;
};

window.ensureForgeMcOptions = async function() {
  const select = document.getElementById('forge-mc-select');
  if (!select || select.dataset.loaded) return;
  const versions = await ensureGameVersionsLoaded();
  select.innerHTML = versions.release.map(id => `<option value="${id}">${id}</option>`).join('');
  select.dataset.loaded = '1';
  window.reloadForgeBuilds();
};

window.reloadForgeBuilds = async function() {
  const mcSelect = document.getElementById('forge-mc-select');
  const buildSelect = document.getElementById('forge-build-select');
  if (!mcSelect || !buildSelect || !mcSelect.value) return;
  buildSelect.innerHTML = `<option>Đang tải danh sách Forge...</option>`;
  try {
    const builds = await getLoaderVersions('forge', mcSelect.value);
    buildSelect.innerHTML = builds.length
      ? builds.map(b => `<option value="${b.version}">${b.version}${b.type === 'recommended' ? ' (khuyên dùng)' : b.type === 'latest' ? ' (mới nhất)' : ''}</option>`).join('')
      : `<option value="">Không có bản Forge cho phiên bản này</option>`;
  } catch (e) {
    console.error('[reloadForgeBuilds]', e);
    buildSelect.innerHTML = `<option value="">Lỗi tải danh sách Forge: ${e?.message || 'không rõ nguyên nhân'}</option>`;
  }
};

window.ensureNeoForgeMcOptions = async function() {
  const select = document.getElementById('neoforge-mc-select');
  if (!select || select.dataset.loaded) return;
  const versions = await ensureGameVersionsLoaded();
  select.innerHTML = versions.release.map(id => `<option value="${id}">${id}</option>`).join('');
  select.dataset.loaded = '1';
  window.reloadNeoForgeBuilds();
};

window.reloadNeoForgeBuilds = async function() {
  const mcSelect = document.getElementById('neoforge-mc-select');
  const buildSelect = document.getElementById('neoforge-build-select');
  if (!mcSelect || !buildSelect || !mcSelect.value) return;
  buildSelect.innerHTML = `<option>Đang tải danh sách NeoForge...</option>`;
  try {
    const builds = await getLoaderVersions('neoforge', mcSelect.value);
    buildSelect.innerHTML = builds.length
      ? builds.map(b => `<option value="${b.version}">${b.version}</option>`).join('')
      : `<option value="">Không có bản NeoForge cho phiên bản này</option>`;
  } catch (e) {
    console.error('[reloadNeoForgeBuilds]', e);
    buildSelect.innerHTML = `<option value="">Lỗi tải danh sách NeoForge: ${e?.message || 'không rõ nguyên nhân'}</option>`;
  }
};

window.ensureFabricMcOptions = async function() {
  const select = document.getElementById('fabric-mc-select');
  if (!select || select.dataset.loaded) return;
  const versions = await ensureGameVersionsLoaded();
  select.innerHTML = versions.release.map(id => `<option value="${id}">${id}</option>`).join('');
  select.dataset.loaded = '1';
  window.reloadFabricBuilds();
};

window.reloadFabricBuilds = async function() {
  const mcSelect = document.getElementById('fabric-mc-select');
  const buildSelect = document.getElementById('fabric-build-select');
  if (!mcSelect || !buildSelect || !mcSelect.value) return;
  buildSelect.innerHTML = `<option>Đang tải danh sách Fabric...</option>`;
  try {
    const builds = await getLoaderVersions('fabric', mcSelect.value);
    buildSelect.innerHTML = builds.length
      ? builds.map(b => `<option value="${b.version}">${b.version}${b.stable ? '' : ' (beta)'}</option>`).join('')
      : `<option value="">Không có bản Fabric cho phiên bản này</option>`;
  } catch (e) {
    console.error('[reloadFabricBuilds]', e);
    buildSelect.innerHTML = `<option value="">Lỗi tải danh sách Fabric: ${e?.message || 'không rõ nguyên nhân'}</option>`;
  }
};

function showNewProfileError(message) {
  const err = document.getElementById('new-profile-error');
  if (!err) return;
  err.querySelector('span').textContent = message;
  err.classList.add('show');
}

window.submitNewProfile = async function() {
  const name = document.getElementById('new-profile-name')?.value?.trim() || null;
  const loader = activeLoaderTab;

  let gameVersion, loaderVersion, versionType;

  if (loader === 'vanilla') {
    const select = document.getElementById('vanilla-version-select');
    gameVersion = select?.value;
    const versions = gameVersionsCache;
    versionType = versions?.snapshot?.includes(gameVersion) ? 'snapshot' : 'release';
    loaderVersion = null;
  } else {
    const mcSelect = document.getElementById(`${loader}-mc-select`);
    const buildSelect = document.getElementById(`${loader}-build-select`);
    gameVersion = mcSelect?.value;
    loaderVersion = buildSelect?.value;
    versionType = 'modified';
  }

  if (!gameVersion) return showNewProfileError('Vui lòng chọn phiên bản Minecraft.');
  if (loader !== 'vanilla' && !loaderVersion) return showNewProfileError(`Vui lòng chọn phiên bản ${loader}.`);

  try {
    await createProfile({ name, loader, gameVersion, loaderVersion, versionType });
    await addVersion({ id: gameVersion, name: gameVersion, type: versionType, label: loaderVersion, color: 'blue', features: [] })

    // Đồng bộ lại bản sao config trong renderer — cấu hình vừa tạo được main
    // process ghi thẳng vào file config (xem src/main/ipc.js), nên nếu không
    // nạp lại ở đây, biến `config` cục bộ sẽ thiếu cấu hình mới này và có thể
    // ghi đè/xoá mất nó ở lần saveConfig(config) tiếp theo (đổi phiên bản,
    // lưu settings...).
    config = await loadConfig();

    window.closeNewProfileModal();
    await window.refreshProfilesList();
  } catch (e) {
    showNewProfileError(e?.message || 'Không thể tạo cấu hình.');
  }
};

// ===================== Khởi chạy game theo Cấu hình =====================

async function launchProfile(profileId) {
  if (!currentAccount) {
    showPage('login');
    return;
  }

  config = await loadConfig();
  config.lastProfileId = profileId;
  await saveConfig(config);
  showPage('home');
}

// Bấm "Chơi" trên 1 dòng cấu hình cụ thể (trang Phiên bản)
window.playProfile = async function(profileId) {
  await launchProfile(profileId);
};

// Nút "Bắt đầu" ở trang chủ / sidebar: chơi cấu hình gần nhất, hoặc cấu hình
// đầu tiên nếu chưa từng chơi, hoặc mở trang "Phiên bản" nếu chưa có cấu hình nào.
window.startGame = async function() {
  if (isLaunching) return;
  if (!currentAccount) {
    showPage('login');
    return;
  }
  profilesCache = profilesCache.length ? profilesCache : await listProfiles();
  const profileId = config.lastProfileId || profilesCache[0]?.id;
  if (!profileId) {
    showPage('versions');
    return;
  }

  isLaunching = true;
  cancelRequestedByUser = false;
  setPlayButtonMode('cancel');
  showProgress('Đang chuẩn bị khởi chạy...', 0);

  try {
    // Thanh tiến trình sẽ được ẩn khi nhận sự kiện 'launched'/'closed' ở trên
    await launchGame(currentAccount, profileId);

  } catch (e) {
    console.error(e);
    hideProgress();
    setPlayButtonMode('normal');
    if (!cancelRequestedByUser) {
      alert('Lỗi: ' + e.message);
    }
  }
  finally {
    isLaunching = false;
  }
};

// Nút "Dừng tải" (chính là nút "Bắt đầu" đổi chế độ trong lúc đang tải/cài
// đặt) — gọi xuống main process để huỷ tác vụ tải đang chạy (xem
// cancelInstall() ở src/core/installer.js).
window.cancelDownload = async function() {
  cancelRequestedByUser = true;
  const btn = document.getElementById('play-main-btn');
  // Khoá tạm nút trong lúc chờ xác nhận huỷ, tránh bấm dồn dập — startGame()
  // ở trên sẽ tự mở khoá lại (setPlayButtonMode('normal')) khi promise
  // launchGame() thực sự kết thúc (bị huỷ).
  if (btn) btn.disabled = true;
  try {
    const hadActiveTask = await cancelInstall();
    if (!hadActiveTask) {
      // Không có tác vụ tải nào đang chạy để huỷ ngay lúc này (ví dụ đang ở
      // giữa 2 bước, hoặc đang trong lúc mclc tự spawn Java — bước đó không
      // thể ngắt giữa chừng, xem ghi chú ở launcher.js). Lá cờ huỷ vẫn được
      // ghi nhận và sẽ chặn lại NGAY khi có cơ hội tiếp theo.
      console.log('[cancelDownload] Đã ghi nhận yêu cầu dừng, sẽ dừng ở bước kế tiếp.');
    }
  } catch (e) {
    console.error('[cancelDownload]', e);
  }
};

// Lưu settings
window.saveSettings = async function() {

  config = await loadConfig();
  config.root = document.getElementById('root-path').value;
  config.memory.max = parseInt(document.getElementById('ram-max').value);

  config.autoRecommendRam = document.getElementById('auto-ram-recommend')?.checked ?? false;

  config.network = config.network || {};
  config.network.useMirror = document.getElementById('use-mirror')?.checked ?? true;
  config.network.proxy = (document.getElementById('proxy-url')?.value || '').trim();

  config.updateCheck = config.updateCheck || {};
  config.updateCheck.checkOnStartup = document.getElementById('update-check-startup')?.checked ?? true;

  await saveConfig(config);

  const toast = document.getElementById('settings-toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
};

window.toggleAutoRam = function() {
  const checkbox = document.getElementById('auto-ram-recommend');
  const slider = document.getElementById('ram-max');
  const display = document.getElementById('ram-display');
  if (!checkbox || !slider) return;

  slider.disabled = checkbox.checked;
  slider.classList.toggle('opacity-50', checkbox.checked);
  slider.classList.toggle('cursor-not-allowed', checkbox.checked);

  if (checkbox.checked) {
    // Tính đề xuất theo đúng cấu hình đang chọn gần nhất, giống nhãn mô tả
    // ngay bên cạnh checkbox ("... theo phiên bản đang chọn").
    const recommended = recommendRamMB(findLastProfile());
    slider.value = recommended;
    if (display) display.textContent = recommended + ' MB';
  }
};

// Cùng loại lỗi với toggleAutoRam ở trên: nút "Kiểm tra Java" gọi
// window.checkJavaStatus() nhưng hàm này cũng chưa từng được định nghĩa.
window.checkJavaStatus = async function() {
  const box = document.getElementById('java-status');
  if (!box) return;
  box.textContent = 'Đang kiểm tra...';
  try {
    const profileId = findLastProfile()?.id;
    const result = await checkJava(profileId);
    if (!result.installed) {
      box.innerHTML = `<span class="status-info"><i class="fas fa-circle-info"></i> Chưa tìm thấy Java trên máy. Không sao — khi bấm "Bắt đầu", launcher sẽ tự tải Java${result.requiredMajor ? ` ${result.requiredMajor}+` : ''} phù hợp, không cần cài thủ công.</span>`;
    } else if (result.compatible) {
      box.innerHTML = `<span class="status-success"><i class="fas fa-circle-check"></i> Đã cài Java ${result.installedMajor}${result.requiredMajor ? ` (yêu cầu ${result.requiredMajor}+ cho ${result.gameVersion})` : ''} — tương thích.</span>`;
    } else {
      box.innerHTML = `<span class="status-info"><i class="fas fa-circle-info"></i> Máy đang cài Java ${result.installedMajor}, nhưng cấu hình "${result.gameVersion}" cần Java ${result.requiredMajor}+ — launcher sẽ tự tải bản Java phù hợp riêng khi bấm "Bắt đầu", không ảnh hưởng tới Java hệ thống.</span>`;
    }
  } catch (e) {
    box.innerHTML = `<span class="status-error"><i class="fas fa-circle-xmark"></i> Không thể kiểm tra Java: ${e?.message || 'lỗi không rõ'}</span>`;
  }
};

// TÍNH NĂNG MỚI: nút "Kiểm tra kết nối mirror" ở Settings — ping thử nguồn
// Mojang chính thức + mirror dự phòng (BMCLAPI), hiển thị trạng thái/độ trễ
// từng nguồn để người dùng biết trước host nào đang chậm/không kết nối
// được, thay vì phải đợi tải thất bại giữa chừng mới biết.
window.checkMirrorsStatus = async function() {
  const box = document.getElementById('mirror-status');
  if (!box) return;
  box.textContent = 'Đang kiểm tra...';
  try {
    const results = await checkMirrors();
    box.innerHTML = results.map(r => {
      const iconClass = r.ok ? 'fa-circle-check status-success' : 'fa-circle-xmark status-error';
      const detail = r.ok ? `${r.ms}ms` : (r.error || `HTTP ${r.statusCode}`);
      return `<div class="mirror-row">
        <span class="mirror-label"><i class="fas ${iconClass}"></i> ${r.label}</span>
        <span class="status-muted">${detail}</span>
      </div>`;
    }).join('');
  } catch (e) {
    box.innerHTML = `<span class="status-error"><i class="fas fa-circle-xmark"></i> Không thể kiểm tra: ${e?.message || 'lỗi không rõ'}</span>`;
  }
};

// TÍNH NĂNG MỚI: trang "Mods & Resource Packs" — dùng @xmcl/mod-parser +
// @xmcl/resourcepack để đọc metadata trực tiếp từ file .jar/.zip, xem
// src/core/mods.js. Chỉ refresh lại phần #mods-content (không dựng lại cả
// trang) sau khi bật/tắt/xoá, để giữ nguyên lựa chọn dropdown của người dùng.
async function reloadModsBody(profileId) {
  const box = document.getElementById('mods-content');
  if (!box) return;
  const [mods, packs] = await Promise.all([listMods(profileId), listResourcePacks(profileId)]);
  box.innerHTML = renderModsBody(profileId, mods, packs);
}

window.onModsProfileChange = async function(profileId) {
  const openFolderBtn = document.querySelector('#mods-content')?.parentElement?.querySelector('button[onclick^="window.openModsFolderUI"]');
  if (openFolderBtn) openFolderBtn.setAttribute('onclick', `window.openModsFolderUI('${profileId}')`);
  await reloadModsBody(profileId);
};

window.toggleModUI = async function(profileId, file, enabled) {
  try {
    await setModEnabled(profileId, file, enabled);
  } catch (e) {
    alert(window.showDialog(e));
  } finally {
    await reloadModsBody(profileId);
  }
};

window.deleteModUI = async function(profileId, file) {
  if (!confirm(`Xoá mod "${file}"? Hành động này không thể hoàn tác.`)) return;
  try {
    await deleteMod(profileId, file);
  } catch (e) {
    alert(window.showDialog(e));
  } finally {
    await reloadModsBody(profileId);
  }
};

window.openModsFolderUI = async function(profileId) {
  await openModsFolder(profileId);
};

window.chooseGameFolder = async function() {
  const dir = await selectFolder();
  if (!dir) return;
  const input = document.getElementById('root-path');
  if (input) input.value = dir;
};

function showMsaModal() {
  currentMsaDeviceCode = null;
  msaLoginAbandoned = false;
  const codeEl = document.getElementById('msa-device-code');
  if (codeEl) codeEl.textContent = '------';
  document.getElementById('msa-device-modal')?.classList.add('show');
}

function hideMsaModal() {
  document.getElementById('msa-device-modal')?.classList.remove('show');
}

// Đăng nhập tài khoản Microsoft - bằng popup form login
// phương pháp trực tiếp từ launcher
window.doMicrosoftLoginAccount = async function() {

  dismissLoginError();

  try {
    currentAccount = await loginWithMicrosoftAccount();
    config.lastAccount = currentAccount;
    await saveConfig(config);
    showPage('home');

  } catch (error) {
    console.error(error);
    showDialog(error);
  }
};

// Đăng nhập bằng tài khoản Microsoft — luồng "device code": không có cửa sổ
// popup nhúng nào yêu cầu nhập mật khẩu ở đây. Launcher chỉ hiện 1 mã ngắn
// (nhận qua onMicrosoftDeviceCode ở trên) và chờ người dùng tự xác thực trên
// trình duyệt hệ thống của họ ở microsoft.com/link.
window.doMicrosoftLoginAuthentication = async function() {
  if (msaLoginInProgress) return;

  dismissLoginError();
  msaLoginInProgress = true;
  showMsaModal();

  try {
    const account = await loginWithMicrosoftAuthentication();
    if (msaLoginAbandoned) return; // người dùng đã bấm Huỷ, bỏ qua kết quả trễ

    currentAccount = account;
    config.lastAccount = currentAccount;
    await saveConfig(config);
    hideMsaModal();
    showPage('home');

  } catch (error) {
    console.error(error);
    hideMsaModal();
    if (!msaLoginAbandoned) showDialog(error);
  } finally {
    msaLoginInProgress = false;
  }
};

// Không có API huỷ giữa chừng luồng device code (giới hạn của prismarine-auth)
// — bấm Huỷ chỉ đóng modal và bỏ qua kết quả trả về trễ, còn yêu cầu xác
// thực bên phía Microsoft sẽ tự hết hạn sau khoảng 15 phút.
window.cancelMsaLogin = function() {
  msaLoginAbandoned = true;
  hideMsaModal();
};

window.copyMsaCode = async function() {
  if (!currentMsaDeviceCode?.userCode) return;
  try {
    await navigator.clipboard.writeText(currentMsaDeviceCode.userCode);
    const btn = document.querySelector('.btn-msa-copy');
    if (btn) {
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1500);
    }
  } catch (e) {
    console.error('[copyMsaCode]', e);
  }
};

window.openMsaLoginPage = async function() {
  const url = currentMsaDeviceCode?.verificationUri || 'https://www.microsoft.com/link';
  try {
    await openMicrosoftLoginPage(url);
  } catch (e) {
    console.error('[openMsaLoginPage]', e);
  }
};

// Đăng nhập Offline bằng tên
window.doOfflineLogin = async function() {
  dismissLoginError();

  const input = document.getElementById('offline-username');
  const username = input ? input.value.trim() : '';

  if (!username) {
    showDialog('Vui lòng nhập tên nhân vật.');
    return;
  }
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
    showDialog('Tên chỉ gồm chữ, số, dấu gạch dưới (3-16 ký tự).');
    return;
  }

  currentAccount = await loginOffline(username);
  config.lastAccount = currentAccount;
  await saveConfig(config);
  showPage('home');
};

// Đăng nhập bằng tài khoản ely.by
window.doElyByLogin = async function() {
  dismissLoginError();

  const usernameInput = document.getElementById('elyby-username');
  const passwordInput = document.getElementById('elyby-password');
  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!username || !password) {
    showDialog('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu ely.by.');
    return;
  }

  try {
    currentAccount = await loginWithElyBy(username, password);
    config.lastAccount = currentAccount;
    await saveConfig(config);
    showPage('home');
  } catch (error) {
    console.error(error);
    showDialog(error);
  }
};

// Đăng xuất
window.logout = async function() {
  // Đăng xuất thật sự cho tài khoản Microsoft: xoá cache refresh token, nếu
  // không lần đăng nhập kế tiếp sẽ tự động dùng lại phiên cũ mà không hiện
  // mã mới.
  if (currentAccount?.meta?.type === 'msa') {
    try { await logoutMicrosoft(); } catch (e) { console.error('[logout]', e); }
  }
  currentAccount = null;
  config.lastAccount = null;
  await saveConfig(config);
  showPage('login');
};

// Áp dụng bản dịch cho các phần tĩnh nằm ngoài router (sidebar/nav) — các
// trang trong #content tự dịch lại mỗi lần render() nên không cần xử lý ở đây.
function applyStaticTranslations() {
  const map = {
    'nav-label-home': 'nav.home',
    'nav-label-versions': 'nav.versions',
    'nav-label-mods': 'nav.mods',
    'nav-label-settings': 'nav.settings',
    'sidebar-credit': 'sidebar.credit',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }
  const authText = document.querySelector('#auth-btn span');
  if (authText && !currentAccount) authText.innerHTML = t('common.login');
}

// Đổi ngôn ngữ ngay lập tức: lưu vào config, render lại toàn bộ phần tĩnh +
// trang đang mở, không cần khởi động lại launcher.
window.changeLocaleUI = async function(locale) {
  setLocale(locale);
  applyStaticTranslations();
  config = await loadConfig();
  config.locale = locale;
  await saveConfig(config);
  await showPage(currentPageName);
};

// Khởi động
(async function init() {

  const versionLauncher = document.querySelector('.version');
  versionLauncher.innerHTML = `v${version}`;

  config = await loadConfig();
  setLocale(config.locale || 'vi');
  applyStaticTranslations();
  if (config.lastAccount) {
    currentAccount = config.lastAccount;
  }
  profilesCache = await listProfiles();
  showPage('home');
})();