import { LOADER_DISPLAY } from './version.js';
import { escapeHtml } from '../utils/html.js';
import { t } from '../i18n/index.js';

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Tên/mô tả mod & resource pack đọc trực tiếp từ file người dùng tự thả vào
// thư mục mods/ — KHÔNG đáng tin, phải escape trước khi chèn vào innerHTML.
// Tên file (mod.file) còn được dùng làm tham số cho toggleModUI/deleteModUI;
// để tránh phải escape 2 lớp (HTML attribute + JS string literal) dễ sai,
// ta lưu nó vào data-file và đọc lại bằng dataset thay vì nhúng thẳng vào
// chuỗi onclick.
function renderModRow(profileId, mod) {
  const safeName = escapeHtml(mod.name);
  const safeFile = escapeHtml(mod.file);
  const safeVersion = escapeHtml(mod.version);
  return `
    <div class="mod-row ${mod.enabled ? '' : 'disabled'}" data-file="${safeFile}">
      <div class="mod-info">
        <p class="mod-name">
          ${safeName}
          ${mod.version ? `<span class="mod-version">${safeVersion}</span>` : ''}
          ${mod.unrecognized ? '<i class="fas fa-triangle-exclamation mod-warning" title="Không đọc được metadata — có thể không đúng loader hoặc file mod bị lỗi"></i>' : ''}
        </p>
        <p class="mod-file">${safeFile}${mod.size ? ` · ${formatSize(mod.size)}` : ''}</p>
      </div>
      <div class="mod-actions">
        <label class="mod-toggle" title="${mod.enabled ? t('mods.toggleOff') : t('mods.toggleOn')}">
          <input type="checkbox" ${mod.enabled ? 'checked' : ''} onchange="window.toggleModUI('${profileId}', this.closest('.mod-row').dataset.file, this.checked)" />
          <div class="mod-toggle-track"></div>
          <div class="mod-toggle-thumb"></div>
        </label>
        <button onclick="window.deleteModUI('${profileId}', this.closest('.mod-row').dataset.file)" title="${t('mods.delete')}" class="btn-delete-mod">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

function renderPackCard(pack) {
  const icon = pack.icon
    ? `<img src="${pack.icon}" class="pack-icon" />`
    : `<div class="pack-icon-placeholder"><i class="fas fa-image"></i></div>`;
  return `
    <div class="pack-row">
      ${icon}
      <div class="pack-info">
        <p class="pack-name">${escapeHtml(pack.file)}</p>
        <p class="pack-desc">${pack.description ? escapeHtml(pack.description) : (pack.unrecognized ? 'Không đọc được pack.mcmeta' : '')}</p>
      </div>
    </div>
  `;
}

export function renderModsBody(profileId, mods, packs) {
  const modsList = mods.length
    ? mods.map(m => renderModRow(profileId, m)).join('')
    : `<p class="mods-empty-text">${t('mods.emptyMods')} <code>mods/</code>.</p>`;

  const packsList = packs.length
    ? packs.map(renderPackCard).join('')
    : `<p class="mods-empty-text">${t('mods.emptyPacks')} <code>resourcepacks/</code>.</p>`;

  return `
    <div class="mods-sections">
      <div class="mods-section">
        <div class="mods-section-header">
          <p class="mods-section-title">
            <i class="fas fa-cubes icon-mods"></i> ${t('mods.sectionMods')} (${mods.length})
          </p>
        </div>
        ${modsList}
      </div>

      <div class="mods-section">
        <div class="mods-section-header">
          <p class="mods-section-title">
            <i class="fas fa-palette icon-packs"></i> ${t('mods.sectionPacks')} (${packs.length})
          </p>
        </div>
        ${packsList}
      </div>
    </div>
  `;
}

export function renderMods(profiles, selectedProfileId, bodyHtml) {
  const modded = (profiles || []).filter(p => p.loader !== 'vanilla');

  if (!modded.length) {
    return `
      <div class="mods-empty">
        <i class="fas fa-puzzle-piece icon-xl"></i>
        <p class="title">${t('mods.emptyPageTitle')}</p>
        <p class="desc">${t('mods.emptyPageDesc')}</p>
      </div>
    `;
  }

  const activeId = modded.some(p => p.id === selectedProfileId) ? selectedProfileId : modded[0].id;
  const options = modded.map(p => {
    return `<option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>${escapeHtml(p.name)} (${p.loader})</option>`;
  }).join('');

  return `
    <div class="mods-page">
      <div class="mods-container">
        <!-- Header -->
        <div class="mods-header">
          <h2 class="mods-title">
            <i class="fa-solid fa-puzzle-piece"></i>
            ${t('mods.title')}
          </h2>
          <div class="mods-underline"></div>
          <p class="mods-subtitle">${t('mods.subtitle')}</p>
        </div>
        <!-- ------ -->

        <div class="mods-toolbar">
          <select id="mods-profile-select" onchange="window.onModsProfileChange(this.value)">
            ${options}
          </select>
          <button onclick="window.openModsFolderUI('${activeId}')" class="btn-open-mods-folder">
            <i class="fas fa-folder-open"></i> ${t('mods.openFolder')}
          </button>
        </div>
        <div id="mods-content">${bodyHtml}</div>
      </div>
    </div>
  `;
}