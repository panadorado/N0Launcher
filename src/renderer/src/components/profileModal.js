import { t } from '../i18n/index.js';

function tabButton(id, icon, label) {
  return `
    <button onclick="window.switchProfileTab('${id}')" data-tab="${id}" class="profile-tab-btn">
      <i class="fas ${icon}"></i> ${label}
    </button>`;
}

export function renderNewProfileModal() {
  return `
  <div id="new-profile-modal">
    <div class="modal-box">

      <div class="modal-header">
        <h3 class="modal-title"><i class="fas fa-cube"></i> ${t('profileModal.title')}</h3>
        <button onclick="window.closeNewProfileModal()" class="modal-close-btn">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <div class="modal-tabs">
        ${tabButton('vanilla', 'fa-cube', 'Vanilla')}
        ${tabButton('forge', 'fa-hammer', 'Forge')}
        ${tabButton('neoforge', 'fa-fire', 'NeoForge')}
        ${tabButton('fabric', 'fa-layer-group', 'Fabric')}
      </div>

      <div class="modal-body">
        <label class="modal-label">${t('profileModal.nameLabel')}</label>
        <input id="new-profile-name" type="text" placeholder="${t('profileModal.namePlaceholder')}" />

        <!-- Vanilla -->
        <div id="panel-vanilla" class="loader-panel">
          <div class="panel-box panel-vanilla">
            <p class="panel-desc"><i class="fas fa-cube"></i> ${t('profileModal.vanillaDesc')}</p>
            <div class="panel-checkboxes">
              <label class="panel-checkbox-label">
                <input type="checkbox" id="vanilla-show-release" checked onchange="window.reloadVanillaVersions()" /> ${t('versions.filter.release')}
              </label>
              <label class="panel-checkbox-label">
                <input type="checkbox" id="vanilla-show-snapshot" onchange="window.reloadVanillaVersions()" /> ${t('versions.filter.snapshot')}
              </label>
            </div>
            <select id="vanilla-version-select" class="panel-select">
              <option>${t('profileModal.loading')}</option>
            </select>
          </div>
        </div>

        <!-- Forge -->
        <div id="panel-forge" class="loader-panel">
          <div class="panel-box panel-forge">
            <p class="panel-desc"><i class="fas fa-hammer"></i> ${t('profileModal.forgeDesc')}</p>
            <label class="panel-select-label">${t('profileModal.mcVersionLabel')}</label>
            <select id="forge-mc-select" onchange="window.reloadForgeBuilds()" class="panel-select">
              <option>${t('profileModal.loading')}</option>
            </select>
            <label class="panel-select-label">Phiên bản Forge</label>
            <select id="forge-build-select" class="panel-select">
              <option>${t('profileModal.chooseMcFirst')}</option>
            </select>
          </div>
        </div>

        <!-- NeoForge -->
        <div id="panel-neoforge" class="loader-panel">
          <div class="panel-box panel-neoforge">
            <p class="panel-desc"><i class="fas fa-fire"></i> ${t('profileModal.neoforgeDesc')}</p>
            <label class="panel-select-label">${t('profileModal.mcVersionLabel')}</label>
            <select id="neoforge-mc-select" onchange="window.reloadNeoForgeBuilds()" class="panel-select">
              <option>${t('profileModal.loading')}</option>
            </select>
            <label class="panel-select-label">Phiên bản NeoForge</label>
            <select id="neoforge-build-select" class="panel-select">
              <option>${t('profileModal.chooseMcFirst')}</option>
            </select>
          </div>
        </div>

        <!-- Fabric -->
        <div id="panel-fabric" class="loader-panel">
          <div class="panel-box panel-fabric">
            <p class="panel-desc"><i class="fas fa-layer-group"></i> ${t('profileModal.fabricDesc')}</p>
            <label class="panel-select-label">${t('profileModal.mcVersionLabel')}</label>
            <select id="fabric-mc-select" onchange="window.reloadFabricBuilds()" class="panel-select">
              <option>${t('profileModal.loading')}</option>
            </select>
            <label class="panel-select-label">Phiên bản Fabric Loader</label>
            <select id="fabric-build-select" class="panel-select">
              <option>${t('profileModal.chooseMcFirst')}</option>
            </select>
          </div>
        </div>

        <p id="new-profile-error">
          <i class="fas fa-circle-exclamation"></i> <span></span>
        </p>
      </div>

      <div class="modal-footer">
        <button onclick="window.closeNewProfileModal()" class="btn-cancel">${t('common.cancel')}</button>
        <button onclick="window.submitNewProfile()" class="btn-create">
          <i class="fas fa-check"></i> ${t('profileModal.create')}
        </button>
      </div>
    </div>
  </div>
  `;
}

export default renderNewProfileModal;