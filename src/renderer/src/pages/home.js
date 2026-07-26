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
  
  console.log(type)
  
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
  slate:   'bg-slate-500/15 text-slate-400 border border-slate-500/40',
  gray:    'bg-gray-500/15 text-gray-400 border border-gray-500/40',
  zinc:    'bg-zinc-500/15 text-zinc-400 border border-zinc-500/40',
  neutral: 'bg-neutral-500/15 text-neutral-400 border border-neutral-500/40',
  stone:   'bg-stone-500/15 text-stone-400 border border-stone-500/40',
  red:     'bg-red-500/15 text-red-400 border border-red-500/40',
  orange:  'bg-orange-500/15 text-orange-400 border border-orange-500/40',
  amber:   'bg-amber-500/15 text-amber-400 border border-amber-500/40',
  yellow:  'bg-yellow-500/15 text-yellow-400 border border-yellow-500/40',
  lime:    'bg-lime-500/15 text-lime-400 border border-lime-500/40',
  green:   'bg-green-500/15 text-green-400 border border-green-500/40',
  emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
  teal:    'bg-teal-500/15 text-teal-400 border border-teal-500/40',
  cyan:    'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40',
  sky:     'bg-sky-500/15 text-sky-400 border border-sky-500/40',
  blue:    'bg-blue-500/15 text-blue-400 border border-blue-500/40',
  indigo:  'bg-indigo-500/15 text-indigo-400 border border-indigo-500/40',
  violet:  'bg-violet-500/15 text-violet-400 border border-violet-500/40',
  purple:  'bg-purple-500/15 text-purple-400 border border-purple-500/40',
  fuchsia: 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/40',
  pink:    'bg-pink-500/15 text-pink-400 border border-pink-500/40',
  rose:    'bg-rose-500/15 text-rose-400 border border-rose-500/40',
};

const VERSION_ICON_CLASSES = {
  slate:   { bg: 'bg-slate-500/15',   text: 'text-slate-400' },
  gray:    { bg: 'bg-gray-500/15',    text: 'text-gray-400' },
  zinc:    { bg: 'bg-zinc-500/15',    text: 'text-zinc-400' },
  neutral: { bg: 'bg-neutral-500/15', text: 'text-neutral-400' },
  stone:   { bg: 'bg-stone-500/15',   text: 'text-stone-400' },
  red:     { bg: 'bg-red-500/15',     text: 'text-red-400' },
  orange:  { bg: 'bg-orange-500/15',  text: 'text-orange-400' },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-400' },
  yellow:  { bg: 'bg-yellow-500/15',  text: 'text-yellow-400' },
  lime:    { bg: 'bg-lime-500/15',    text: 'text-lime-400' },
  green:   { bg: 'bg-green-500/15',   text: 'text-green-400' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  teal:    { bg: 'bg-teal-500/15',    text: 'text-teal-400' },
  cyan:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-400' },
  sky:     { bg: 'bg-sky-500/15',     text: 'text-sky-400' },
  blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-400' },
  indigo:  { bg: 'bg-indigo-500/15',  text: 'text-indigo-400' },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-400' },
  purple:  { bg: 'bg-purple-500/15',  text: 'text-purple-400' },
  fuchsia: { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-400' },
  pink:    { bg: 'bg-pink-500/15',    text: 'text-pink-400' },
  rose:    { bg: 'bg-rose-500/15',    text: 'text-rose-400' },
};

function versionBadgeClasses(color) {
  return VERSION_BADGE_CLASSES[color] || VERSION_BADGE_CLASSES.zinc;
}

function versionIconClasses(color) {
  return VERSION_ICON_CLASSES[color] || VERSION_ICON_CLASSES.zinc;
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
          <span class="hero-badge">Norach Launcher</span>
          <h2 class="hero-title">Minecraft Java Edition!</h2>
          <p class="hero-subtitle">
            ${isLoggedIn
              ? `Đang đăng nhập: <span class="account-name">${currentAccount.name}</span> <span>(${accountType})</span>`
              : `Bạn chưa đăng nhập.`}
          </p>
        </div>
      </div>

      <!-- ===== Preview Version ===== -->
      <div class="preview-card">
        ${lastProfile ? `
          <div class="preview-header">
            <div>
              <p class="preview-label">Xem trước phiên bản</p>
              <h3 class="preview-title">
                <span class="version-badge ${versionInfo ? versionBadgeClasses(versionInfo.color) : 'version-badge-default'}">
                  <i class="fas fa-cube"></i>
                  ${selectedVersion}
                </span>
                ${versionInfo ? `
                  <span class="version-badge ${versionBadgeClasses(versionInfo.color)}">
                    ${!versionInfo.label ? minecraftUpdates[randomIndex] : versionInfo.label}
                  </span>` : ''}
                ${lastProfile.loader !== 'vanilla' ? `
                  <span class="version-badge version-badge-default">
                    ${lastProfile.loader}
                  </span>` : `
                  <span class="version-badge ${versionInfo ? versionBadgeClasses(versionInfo.color) : 'version-badge-default'}">
                    ${lastProfile.name}
                  </span>
                `}
              </h3>
            </div>
            <button id="play-main-btn" onclick="startGame()">
              <i id="play-btn-icon" class="fas fa-play"></i>
              <span id="play-btn-text">Bắt đầu</span>
            </button>
          </div>

          <hr class="preview-divider" />

          ${versionInfo && (versionInfo.features || []).length ? `
            <div class="feature-grid">
              ${versionInfo.features.map(f => `
                <div class="feature-card">
                  <div class="feature-icon ${versionIconClasses(versionInfo.color).bg}">
                    <i class="fas ${f.icon} ${versionIconClasses(versionInfo.color).text} text-sm"></i>
                  </div>
                  <p class="feature-text">${f.text}</p>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <i class="fas fa-circle-info text-2xl"></i>
              <p class="text-sm">Chưa có thông tin tính năng nổi bật cho phiên bản này. Bạn vẫn có thể bấm "Bắt đầu" để khởi chạy.</p>
            </div>
          `}
        ` : `
          <div class="empty-state full">
            <i class="fas fa-cube text-4xl"></i>
            <p class="title">Chưa chọn phiên bản</p>
            <p class="desc">Bấm nút "Chọn phiên bản" ở trên để xem tính năng nổi bật.</p>
          </div>
        `}
      </div>

    </div>
  `;
}

export default renderHome;