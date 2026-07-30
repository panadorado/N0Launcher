import { recommendRamMB } from '../utils/ram.js';
import { escapeHtml } from '../utils/html.js';
import { t, getLocale, availableLocales } from '../i18n/index.js';

const LOCALE_LABELS = { vi: 'Tiếng Việt', en: 'English' };

export function renderSettings(config, lastProfile = null) {
  const ramMax = config?.memory?.max ?? 2048;
  const autoRam = !!config?.autoRecommendRam;
  const recommended = recommendRamMB(lastProfile);
  const useMirror = config?.network?.useMirror !== false;
  const proxy = config?.network?.proxy || '';
  const checkOnStartup = config?.updateCheck?.checkOnStartup !== false;
  const locale = config?.locale || getLocale();

  const localeOptions = availableLocales().map(code =>
    `<option value="${code}" ${code === locale ? 'selected' : ''}>${LOCALE_LABELS[code] || code}</option>`
  ).join('');

  return `
    <div class="settings-page">
      <div class="setting-container">

        <!-- Header -->
        <div class="settings-header">
          <h2 class="settings-title">
            <i class="fas fa-gear"></i> ${t('settings.title')}
          </h2>
          <div class="settings-underline"></div>
          <p class="settings-subtitle">${t('settings.subtitle')}</p>
        </div>

        <div class="settings-cards">

          <!-- Card: Đường dẫn game -->
          <div class="settings-card">
            <div class="settings-card-header">
              <i class="fas fa-folder-open settings-card-icon-blue"></i>
              <label for="root-path" class="settings-card-title">${t('settings.rootPath.label')}</label>
            </div>

            <div class="path-row">
              <input id="root-path" value="${escapeHtml(config.root)}" readonly />
              <button onclick="chooseGameFolder()" class="btn-browse">
                <i class="fas fa-folder"></i> ${t('settings.rootPath.browse')}
              </button>
            </div>
            <p class="settings-hint">${t('settings.rootPath.hint')}</p>
          </div>

          <!-- Card: RAM -->
          <div class="settings-card">
            <div class="settings-card-header between">
              <div class="settings-card-header" style="margin-bottom:0">
                <i class="fas fa-memory settings-card-icon-green"></i>
                <label for="ram-max" class="settings-card-title">${t('settings.ram.label')}</label>
              </div>
              <span id="ram-display" class="ram-value">${ramMax} MB</span>
            </div>

            <input id="ram-max" type="range" min="512" max="16384" step="256" value="${ramMax}" ${autoRam ? 'disabled' : ''}
                  oninput="document.getElementById('ram-display').textContent = this.value + ' MB';" />

            <div class="ram-range-labels">
              <span>512 MB</span>
              <span>16 GB</span>
            </div>
            <p class="settings-hint">${t('settings.ram.hint')}</p>

            <label class="auto-ram-label">
              <input id="auto-ram-recommend" type="checkbox" ${autoRam ? 'checked' : ''} onchange="window.toggleAutoRam()" />
              ${t('settings.ram.autoLabel')}
              <span class="auto-ram-hint">(${lastProfile ? `${recommended} MB — "${escapeHtml(lastProfile.name)}"` : ''})</span>
            </label>
          </div>

          <!-- Card: Kiểm tra Java -->
          <div class="settings-card">
            <div class="settings-card-header between">
              <div class="settings-card-header" style="margin-bottom:0">
                <i class="fas fa-mug-hot settings-card-icon-amber"></i>
                <label class="settings-card-title">${t('settings.java.label')}</label>
              </div>
              <button onclick="window.checkJavaStatus()" class="btn-check">
                <i class="fas fa-magnifying-glass"></i> ${t('settings.java.check')}
              </button>
            </div>
            <div id="java-status">
              ${t('settings.java.hint')}
            </div>
          </div>

          <!-- Card: Mạng & Mirror -->
          <div class="settings-card">
            <div class="settings-card-header">
              <i class="fas fa-tower-broadcast settings-card-icon-cyan"></i>
              <label class="settings-card-title">${t('settings.network.label')}</label>
            </div>

            <label class="network-label">
              <input id="use-mirror" type="checkbox" ${useMirror ? 'checked' : ''} />
              ${t('settings.network.mirrorLabel')}
            </label>
            <p class="settings-hint" style="margin-bottom:1rem">${t('settings.network.mirrorHint')}</p>

            <label for="proxy-url" class="proxy-label">${t('settings.network.proxyLabel')}</label>
            <input id="proxy-url" type="text" value="${escapeHtml(proxy)}" placeholder="${t('settings.network.proxyPlaceholder')}" />
            <p class="settings-hint">${t('settings.network.proxyHint')}</p>

            <button onclick="window.checkMirrorsStatus()" class="btn-check cyan" style="margin-top:1rem">
              <i class="fas fa-satellite-dish"></i> ${t('settings.network.checkMirrors')}
            </button>
            <div id="mirror-status"></div>
          </div>

          <!-- Card: Cập nhật -->
          <div class="settings-card">
            <div class="settings-card-header between">
              <div class="settings-card-header" style="margin-bottom:0">
                <i class="fas fa-rocket settings-card-icon-blue"></i>
                <label class="settings-card-title">${t('settings.update.label')}</label>
              </div>
              <button onclick="window.checkForUpdatesUI()" class="btn-check">
                <i class="fas fa-arrows-rotate"></i> ${t('settings.update.check')}
              </button>
            </div>
            <p class="settings-hint">${t('settings.update.currentVersion')} <strong id="app-version-label">...</strong></p>
            <label class="auto-ram-label" style="margin-top:0.5rem">
              <input id="update-check-startup" type="checkbox" ${checkOnStartup ? 'checked' : ''} />
              ${t('settings.update.autoCheck')}
            </label>
            <div id="update-status" style="margin-top:0.75rem">${t('settings.update.notChecked')}</div>
          </div>

          <!-- Card: Ngôn ngữ -->
          <div class="settings-card">
            <div class="settings-card-header">
              <i class="fas fa-language settings-card-icon-green"></i>
              <label for="locale-select" class="settings-card-title">${t('settings.language.label')}</label>
            </div>
            <select id="locale-select" class="panel-select" onchange="window.changeLocaleUI(this.value)">
              ${localeOptions}
            </select>
          </div>

        </div>

        <!-- Nút lưu + thông báo -->
        <div class="settings-actions">
          <button onclick="saveSettings()" class="btn-save-settings">
            <i class="fas fa-floppy-disk"></i> ${t('settings.save')}
          </button>
          <span id="settings-toast">
            <i class="fas fa-check-circle"></i> ${t('settings.saved')}
          </span>
        </div>

      </div>
    </div>
  `;
}

export default renderSettings;
