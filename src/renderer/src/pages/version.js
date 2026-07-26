import { renderNewProfileModal } from '../components/profileModal.js';

// Thông tin hiển thị (icon + class màu) theo từng loader
export const LOADER_DISPLAY = {
  vanilla:  { icon: 'fa-cube',        classes: 'loader-vanilla' },
  forge:    { icon: 'fa-hammer',      classes: 'loader-forge' },
  neoforge: { icon: 'fa-fire',        classes: 'loader-neoforge' },
  fabric:   { icon: 'fa-layer-group', classes: 'loader-fabric' },
};

export function renderProfileRow(p) {
  const meta = LOADER_DISPLAY[p.loader] || LOADER_DISPLAY.vanilla;
  const versionLabel = p.loader === 'vanilla'
    ? p.gameVersion
    : `${p.gameVersion}-${p.loader}-${p.loaderVersion}`;
  const modifiedBadge = p.loader !== 'vanilla'
    ? `<i class="fas fa-triangle-exclamation text-yellow-500 text-xs" title="Cấu hình đã sửa đổi (có mod)"></i>`
    : '';

  return `
    <div class="profile-row">
      <div class="profile-row-left">
        <div class="profile-icon ${meta.classes}">
          <i class="fas ${meta.icon}"></i>
        </div>
        <div class="profile-info">
          <p class="profile-name">${p.name} ${modifiedBadge}</p>
          <p class="profile-version">${versionLabel}</p>
        </div>
      </div>
      <div class="profile-actions">
        <button onclick="playProfile('${p.id}')" class="btn-play-profile">chọn</button>
        <button onclick="openProfileFolderUI('${p.id}')" title="Mở thư mục" class="btn-icon">
          <i class="fas fa-folder"></i>
        </button>
        <div class="profile-menu">
          <button onclick="toggleProfileMenu('${p.id}')" title="Thêm" class="btn-icon">
            <i class="fas fa-ellipsis"></i>
          </button>
          <div id="menu-${p.id}" class="profile-menu-dropdown">
            <button onclick="deleteProfileUI('${p.id}')" class="profile-menu-item">
              <i class="fas fa-trash"></i> Xoá cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderEmptyState() {
  return `
    <div class="versions-empty">
      <i class="fas fa-box-open text-3xl"></i>
      <p class="title">Chưa có cấu hình nào</p>
      <p class="desc">Bấm "Cấu hình mới" để tạo cấu hình Vanilla, Forge, NeoForge hoặc Fabric.</p>
    </div>
  `;
}

export async function renderVersions() {
  return `
    <div class="versions-page">

      <div class="versions-toolbar">
        <div class="versions-field">
          <label class="versions-label">Tìm kiếm</label>
          <div class="versions-search-wrap">
            <i class="fas fa-search versions-search-icon"></i>
            <input id="profile-search" type="text" placeholder="Tên cấu hình" oninput="refreshProfilesList()" />
          </div>
        </div>

        <div>
          <label class="versions-label">Sắp xếp theo</label>
          <select id="profile-sort" onchange="refreshProfilesList()">
            <option value="name">Tên</option>
            <option value="version">Phiên bản</option>
            <option value="created">Ngày tạo</option>
          </select>
        </div>

        <div>
          <label class="versions-label">Phiên bản</label>
          <div class="versions-filters">
            <label class="versions-filter-label">
              <input id="filter-release" type="checkbox" checked onchange="refreshProfilesList()" /> Phát hành
            </label>
            <label class="versions-filter-label">
              <input id="filter-snapshot" type="checkbox" checked onchange="refreshProfilesList()" /> Bản thử nghiệm
            </label>
            <label class="versions-filter-label">
              <input id="filter-modified" type="checkbox" checked onchange="refreshProfilesList()" /> Đã sửa đổi
            </label>
          </div>
        </div>
      </div>

      <hr class="versions-divider" />

      <button onclick="openNewProfileModal()" class="btn-new-profile">
        <i class="fas fa-plus"></i> Cấu hình mới
      </button>

      <div id="profiles-list">
        <p class="profiles-loading">Đang tải danh sách cấu hình...</p>
      </div>
    </div>

    ${renderNewProfileModal()}
  `;
}

export default renderVersions;