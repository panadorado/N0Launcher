import { escapeHtml } from '../utils/html.js';
import { t } from '../i18n/index.js';

// Trang chủ. Chạy trong renderer (browser), không cần Node/IPC.
//
// getVersionList được truyền vào là window.api.getVersionList (một lời gọi
// IPC hợp lệ, trả về Promise<Array>) — vẫn dùng để lấy tin tức/tính năng nổi
// bật theo phiên bản Minecraft (xem src/core/versions.js). Cấu hình đang
// được chơi gần nhất (lastProfile) được truyền vào từ app.js, lấy từ danh
// sách Cấu hình (xem src/core/profiles.js) thay vì config.version đơn lẻ
// như trước — vì giờ có thể có nhiều cấu hình (Vanilla/Forge/NeoForge/Fabric).
export function typeAccount(type) {
  let meta = null; 
  
  switch(type) {
    case "msa": { meta = 'Microsoft'; break; }
    case "elyby": { meta = 'Ely.by'; break; }
    case "mojang": { meta = 'Offline'; break; }
    default: { meta = 'Offline'; break; }
  }
  return meta;
}

// Bảng màu tĩnh cho badge/icon theo versionInfo.color.
// QUAN TRỌNG: Tailwind quét mã nguồn để tìm CHUỖI CLASS ĐẦY ĐỦ, không chạy
// code — nên không được ghép class kiểu `bg-${color}-500/15` (Tailwind sẽ
// không bao giờ thấy "bg-blue-500/15" là 1 chuỗi trọn vẹn ở đâu cả, dẫn tới
// CSS không được sinh ra và phần tử mất style). Thay vào đó khai báo sẵn
// từng class đầy đủ trong object bên dưới, giống cách LOADER_DISPLAY đang
// làm ở version.js.
const VERSION_BADGE_CLASSES = {
  slate:   'version-badge version-badge-slate',
  gray:    'version-badge version-badge-gray',
  zinc:    'version-badge version-badge-zinc',
  neutral: 'version-badge version-badge-neutral',
  stone:   'version-badge version-badge-stone',
  red:     'version-badge version-badge-red',
  orange:  'version-badge version-badge-orange',
  amber:   'version-badge version-badge-amber',
  yellow:  'version-badge version-badge-yellow',
  lime:    'version-badge version-badge-lime',
  green:   'version-badge version-badge-green',
  emerald: 'version-badge version-badge-emerald',
  teal:    'version-badge version-badge-teal',
  cyan:    'version-badge version-badge-cyan',
  sky:     'version-badge version-badge-sky',
  blue:    'version-badge version-badge-blue',
  indigo:  'version-badge version-badge-indigo',
  violet:  'version-badge version-badge-violet',
  purple:  'version-badge version-badge-purple',
  fuchsia: 'version-badge version-badge-fuchsia',
  pink:    'version-badge version-badge-pink',
  rose:    'version-badge version-badge-rose',
};

const VERSION_ICON_CLASSES = {
  slate:   { bg: 'version-icon version-icon-slate', text: 'version-icon-slate' },
  gray:    { bg: 'version-icon version-icon-gray',  text: 'version-icon-gray' },
  zinc:    { bg: 'version-icon version-icon-zinc',  text: 'version-icon-zinc' },
  neutral: { bg: 'version-icon version-icon-neutral', text: 'version-icon-neutral' },
  stone:   { bg: 'version-icon version-icon-stone', text: 'version-icon-stone' },
  red:     { bg: 'version-icon version-icon-red',   text: 'version-icon-red' },
  orange:  { bg: 'version-icon version-icon-orange', text: 'version-icon-orange' },
  amber:   { bg: 'version-icon version-icon-amber', text: 'version-icon-amber' },
  yellow:  { bg: 'version-icon version-icon-yellow', text: 'version-icon-yellow' },
  lime:    { bg: 'version-icon version-icon-lime',  text: 'version-icon-lime' },
  green:   { bg: 'version-icon version-icon-green', text: 'version-icon-green' },
  emerald: { bg: 'version-icon version-icon-emerald', text: 'version-icon-emerald' },
  teal:    { bg: 'version-icon version-icon-teal',  text: 'version-icon-teal' },
  cyan:    { bg: 'version-icon version-icon-cyan',  text: 'version-icon-cyan' },
  sky:     { bg: 'version-icon version-icon-sky',   text: 'version-icon-sky' },
  blue:    { bg: 'version-icon version-icon-blue',  text: 'version-icon-blue' },
  indigo:  { bg: 'version-icon version-icon-indigo', text: 'version-icon-indigo' },
  violet:  { bg: 'version-icon version-icon-violet', text: 'version-icon-violet' },
  purple:  { bg: 'version-icon version-icon-purple', text: 'version-icon-purple' },
  fuchsia: { bg: 'version-icon version-icon-fuchsia', text: 'version-icon-fuchsia' },
  pink:    { bg: 'version-icon version-icon-pink',  text: 'version-icon-pink' },
  rose:    { bg: 'version-icon version-icon-rose',  text: 'version-icon-rose' },
};


function versionBadgeClasses(color) {
  return VERSION_BADGE_CLASSES[color] || VERSION_BADGE_CLASSES.zinc;
}

function versionIconClasses(color) {
  return VERSION_ICON_CLASSES[color] || VERSION_ICON_CLASSES.zinc;
}

const MODLOADER_BADGE_CLASS = {
  vanilla:  VERSION_BADGE_CLASSES['emerald'],
  forge:    VERSION_BADGE_CLASSES['slate'],
  neoforge: VERSION_BADGE_CLASSES['orange'],
  fabric:   VERSION_BADGE_CLASSES['cyan']
}

const MODLOADER_ICON_CLASS = {  
  vanilla:  VERSION_ICON_CLASSES['emerald'],
  forge:    VERSION_ICON_CLASSES['slate'],
  neoforge: VERSION_ICON_CLASSES['orange'],
  fabric:   VERSION_ICON_CLASSES['cyan']
}

const MODLOADER_ICON_NAME = {
  Vanilla: 'fa-brands fa-bitbucket',
  Forge: 'fas fa-hammer',
  NeoForge: 'fab fa-gitlab',
  Fabric: 'fas fa-layer-group',
}

function versionBadgeModLoader(nameloader) {
  return MODLOADER_BADGE_CLASS[nameloader] || VERSION_BADGE_CLASSES.blue;
}

function versionIconModLoader(nameloader) {
  return MODLOADER_ICON_CLASS[nameloader] || VERSION_ICON_CLASSES.blue;
}

export async function renderHome(currentAccount, config, getVersionList, lastProfile) {
  const isLoggedIn = !!currentAccount;
  const accountType = typeAccount(currentAccount?.meta?.type);
  const selectedVersion = lastProfile?.gameVersion || null;

  const versions = await getVersionList();
  const versionInfo = selectedVersion ? versions.find(v => v.id === selectedVersion) || null : null;

  const minecraftUpdates = [
    "The Halloween Update",
    "The Update That Changed The World",
    "The Bountiful Update",
    "The World of Color Update",
    "The Nether Update",
    "Tricky Trials Update"
  ];
  const randomIndex = Math.floor(Math.random() * minecraftUpdates.length);

  return `
    <div class="minecraft-bg">

      <!-- ===== Background: banner hero ===== -->
      <div class="hero-banner">
        <img class="imageCover" alt="Minecraft background" />
        <div class="hero-overlay"></div>

        <div class="hero-content">
          <h2 class="hero-title">Minecraft Java Edition!</h2>
          <p class="hero-subtitle">
            ${isLoggedIn
              ? `${t('home.loggedInAs')} <span class="account-name">${escapeHtml(currentAccount.name)}</span> <span>(${escapeHtml(accountType)})</span>`
              : t('home.notLoggedIn')}
          </p>
        </div>
      </div>

      <!-- ===== Preview Version ===== -->
      <div class="preview-card">
        ${lastProfile ? `
          <div class="preview-header">
            <div>
              <p class="preview-label">${t('home.previewLabel')}</p>
              <h3 class="preview-title">
                <span class="version-badge ${versionBadgeModLoader(lastProfile.loader)}">
                  <i class="fas fa-cube"></i>
                  ${escapeHtml(selectedVersion)}
                </span>
                ${versionInfo ? `
                  <span class="version-badge ${versionBadgeModLoader(lastProfile.loader)}">
                    <i class="fa-solid fa-tag"></i>
                    ${escapeHtml(!versionInfo.label ? minecraftUpdates[randomIndex] : versionInfo.label)}
                  </span>` : ''
                }
               <span class="version-badge ${versionBadgeModLoader(lastProfile.loader)}">
                <i class="${MODLOADER_ICON_NAME[lastProfile.name.match(/^[^\s]+/)[0]]}"></i>
                ${escapeHtml(lastProfile.name)}
               </span>
              </h3>
            </div>
            <button id="play-main-btn" onclick="startGame()">
              <i id="play-btn-icon" class="fas fa-play"></i>
              <span id="play-btn-text">${t('common.start')}</span>
            </button>
          </div>

          <hr class="preview-divider" />

          ${versionInfo && (versionInfo.features || []).length ? `
            <div class="feature-grid">
              ${versionInfo.features.map(f => `
                <div class="feature-card">
                  <div class="feature-icon ${versionIconModLoader(lastProfile.loader).bg}">
                    <i class="fas ${f.icon} ${versionIconModLoader(lastProfile.loader).text} text-sm"></i>
                  </div>
                  <p class="feature-text">${f.text}</p>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <i class="fas fa-circle-info text-2xl"></i>
              <p class="text-sm">${t('home.noFeatureInfo')}</p>
            </div>
          `}
        ` : `
          <div class="empty-state full">
            <i class="fas fa-cube text-4xl"></i>
            <p class="title">${t('home.noProfileTitle')}</p>
            <p class="desc">${t('home.noProfileDesc')}</p>
          </div>
        `}
      </div>

    </div>
  `;
}

export default renderHome;