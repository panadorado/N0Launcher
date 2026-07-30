import { renderNewProfileModal } from '../components/profileModal.js';
import { escapeHtml } from '../utils/html.js';
import { t } from '../i18n/index.js';

// Thông tin hiển thị (icon + class màu) theo từng loader
export const LOADER_DISPLAY = {
  vanilla:  { icon: 'fa-brands fa-bitbucket', classes: 'loader-vanilla' },
  forge:    { icon: 'fas fa-hammer', classes: 'loader-forge' },
  neoforge: { icon: 'fab fa-gitlab', classes: 'loader-neoforge' },
  fabric:   { icon: 'fas fa-layer-group', classes: 'loader-fabric' },
};

export function renderProfileRow(p) {
  const meta = LOADER_DISPLAY[p.loader] || LOADER_DISPLAY.vanilla;
  const versionLabel = p.loader === 'vanilla' ? p.gameVersion : `${p.gameVersion}-${p.loader}-${p.loaderVersion}`;
  const modifiedBadge = p.loader !== 'vanilla' ? `<i class="fas fa-triangle-exclamation text-yellow-500 text-xs" title="Cấu hình đã sửa đổi (có mod)"></i>` : '';

  return `
    <div class="profile-row">
      <div class="profile-row-left">
        <div class="profile-icon ${meta.classes}">
          <i class="${meta.icon}"></i>
        </div>
        <div class="profile-info">
          <p class="profile-name">${escapeHtml(p.name)} ${modifiedBadge}</p>
          <p class="profile-version">${escapeHtml(versionLabel)}</p>
        </div>
      </div>
      <div class="profile-actions">
        <button onclick="playProfile('${p.id}')" class="btn-play-profile">${t('versions.row.select')}</button>
        <button onclick="openProfileFolderUI('${p.id}')" title="${t('versions.row.openFolder')}" class="btn-icon">
          <i class="fas fa-folder"></i>
        </button>
        <div class="profile-menu">
          <button onclick="toggleProfileMenu('${p.id}')" title="${t('versions.row.more')}" class="btn-icon">
            <i class="fas fa-ellipsis"></i>
          </button>
          <div id="menu-${p.id}" class="profile-menu-dropdown">
            <button onclick="deleteProfileUI('${p.id}')" class="profile-menu-item">
              <i class="fas fa-trash"></i> ${t('versions.row.delete')}
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
      <p class="title">${t('versions.emptyTitle')}</p>
      <p class="desc">${t('versions.emptyDesc')}</p>
    </div>
  `;
}

export async function renderVersions() {
  return `
    <div class="versions-page">
      <div class="versions-container">
      
        <!-- Header -->
        <div class="versions-header">
          <h2 class="versions-title">
            <i class="fa-solid fa-list-ul"></i>
            ${t('versions.title')}
          </h2>
          <div class="versions-underline"></div>
          <p class="versions-subtitle">${t('versions.subtitle')}</p>
        </div>

        <div class="versions-toolbar">
          <div class="versions-field">
            <label class="versions-label">${t('versions.search.label')}</label>
            <div class="versions-search-wrap">
              <i class="fas fa-search versions-search-icon"></i>
              <input id="profile-search" type="text" placeholder="${t('versions.search.placeholder')}" oninput="refreshProfilesList()" />
            </div>
          </div>

          <div>
            <label class="versions-label">${t('versions.sort.label')}</label>
            <select id="profile-sort" onchange="refreshProfilesList()">
              <option value="name">${t('versions.sort.name')}</option>
              <option value="version">${t('versions.sort.version')}</option>
              <option value="created">${t('versions.sort.created')}</option>
            </select>
          </div>

          <div>
            <label class="versions-label">${t('versions.filter.label')}</label>
            <div class="versions-filters">
              <label class="versions-filter-label">
                <input id="filter-release" type="checkbox" checked onchange="refreshProfilesList()" /> ${t('versions.filter.release')}
              </label>
              <label class="versions-filter-label">
                <input id="filter-snapshot" type="checkbox" checked onchange="refreshProfilesList()" /> ${t('versions.filter.snapshot')}
              </label>
              <label class="versions-filter-label">
                <input id="filter-modified" type="checkbox" checked onchange="refreshProfilesList()" /> ${t('versions.filter.modified')}
              </label>
            </div>
          </div>
        </div>

        <hr class="versions-divider" />

        <button onclick="openNewProfileModal()" class="btn-new-profile">
          <i class="fas fa-plus"></i> ${t('versions.newProfile')}
        </button>

        <div id="profiles-list">
          <p class="profiles-loading">${t('versions.loading')}</p>
        </div>

      </div>
    </div>

    ${renderNewProfileModal()}
  `;
}

export default renderVersions;