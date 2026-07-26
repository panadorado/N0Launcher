import { LOADER_DISPLAY } from './version.js';

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function renderModRow(profileId, mod) {
  return `
    <div class="mod-row ${mod.enabled ? '' : 'disabled'}">
      <div class="mod-info">
        <p class="mod-name">
          ${mod.name}
          ${mod.version ? `<span class="mod-version">${mod.version}</span>` : ''}
          ${mod.unrecognized ? '<i class="fas fa-triangle-exclamation mod-warning" title="Không đọc được metadata — có thể không đúng loader hoặc file mod bị lỗi"></i>' : ''}
        </p>
        <p class="mod-file">${mod.file}${mod.size ? ` · ${formatSize(mod.size)}` : ''}</p>
      </div>
      <div class="mod-actions">
        <label class="mod-toggle" title="${mod.enabled ? 'Tắt mod' : 'Bật mod'}">
          <input type="checkbox" ${mod.enabled ? 'checked' : ''} onchange="window.toggleModUI('${profileId}', '${mod.file}', this.checked)" />
          <div class="mod-toggle-track"></div>
          <div class="mod-toggle-thumb"></div>
        </label>
        <button onclick="window.deleteModUI('${profileId}', '${mod.file}')" title="Xoá mod" class="btn-delete-mod">
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
        <p class="pack-name">${pack.file}</p>
        <p class="pack-desc">${pack.description || (pack.unrecognized ? 'Không đọc được pack.mcmeta' : '')}</p>
      </div>
    </div>
  `;
}

export function renderModsBody(profileId, mods, packs) {
  const modsList = mods.length
    ? mods.map(m => renderModRow(profileId, m)).join('')
    : `<p class="mods-empty-text">Chưa có mod nào trong thư mục <code>mods/</code>.</p>`;

  const packsList = packs.length
    ? packs.map(renderPackCard).join('')
    : `<p class="mods-empty-text">Chưa có resource pack nào trong thư mục <code>resourcepacks/</code>.</p>`;

  return `
    <div class="mods-sections">
      <div class="mods-section">
        <div class="mods-section-header">
          <p class="mods-section-title">
            <i class="fas fa-cubes icon-mods"></i> Mods (${mods.length})
          </p>
        </div>
        ${modsList}
      </div>

      <div class="mods-section">
        <div class="mods-section-header">
          <p class="mods-section-title">
            <i class="fas fa-palette icon-packs"></i> Resource Packs (${packs.length})
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
        <p class="title">Chưa có cấu hình nào dùng mod</p>
        <p class="desc">Tạo một cấu hình Forge, NeoForge hoặc Fabric ở trang "Phiên bản" để quản lý mod &amp; resource pack tại đây.</p>
      </div>
    `;
  }

  const activeId = modded.some(p => p.id === selectedProfileId) ? selectedProfileId : modded[0].id;
  const options = modded.map(p => {
    return `<option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>${p.name} (${p.loader})</option>`;
  }).join('');

  return `
    <div class="mods-page">
      <div class="mods-container">
        <!-- Header -->
        <div class="mods-header">
          <h2 class="mods-title">
            <i class="fa-solid fa-puzzle-piece"></i>
            Mods và ResourcePacks
          </h2>
          <div class="mods-underline"></div>
          <p class="mods-subtitle">Quản lý mods và resourcepacks của từng phiên bản</p>
        </div>
        <!-- ------ -->

        <div class="mods-toolbar">
          <select id="mods-profile-select" onchange="window.onModsProfileChange(this.value)">
            ${options}
          </select>
          <button onclick="window.openModsFolderUI('${activeId}')" class="btn-open-mods-folder">
            <i class="fas fa-folder-open"></i> Mở thư mục mods
          </button>
        </div>
        <div id="mods-content">${bodyHtml}</div>
      </div>
    </div>
  `;
}