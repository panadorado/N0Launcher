import { t } from '../i18n/index.js';

export function loginWithMicrosoft() {
  return `
    <div class="login-card login-card--microsoft">
      <div class="login-card-overlay"></div>

      <div class="login-card-icon">
        <i class="fab fa-microsoft"></i>
      </div>

      <h3 class="login-card-title">${t('login.msa.title')}</h3>
      <p class="login-card-desc">${t('login.msa.desc')}</p>
      <button onclick="doMicrosoftLoginAccount()" class="login-btn">
        <i class="fas fa-user"></i> ${t('login.msa.buttonPopup')}
      </button>
      <button onclick="doMicrosoftLoginAuthentication()" class="login-btn">
        <i class="fa-solid fa-earth-africa"></i> ${t('login.msa.buttonBrowser')}
      </button>
    </div>
  `;
}

export function loginWithOffline() {
  return `
    <div class="login-card login-card--offline">
      <div class="login-card-overlay"></div>

      <div class="login-card-icon">
        <i class="fas fa-user"></i>
      </div>

      <h3 class="login-card-title">${t('login.offline.title')}</h3>
      <p class="login-card-desc">${t('login.offline.desc')}</p>

      <input id="offline-username" maxlength="16" placeholder="${t('login.offline.placeholder')}" class="login-input" />

      <button onclick="doOfflineLogin()" class="login-btn">
        <i class="fas fa-play"></i> ${t('login.offline.button')}
      </button>
    </div>
  `;
}

export function loginWithElyBy() {
  return `
    <div class="login-card login-card--elyby">
      <div class="login-card-overlay"></div>

      <div class="login-card-icon">
        <i class="fa-solid fa-e"></i>
      </div>

      <h3 class="login-card-title">${t('login.elyby.title')}</h3>
      <p class="login-card-desc">${t('login.elyby.desc')}</p>

      <input id="elyby-username" placeholder="${t('login.elyby.usernamePlaceholder')}" class="login-input" />
      <input id="elyby-password" type="password" placeholder="${t('login.elyby.passwordPlaceholder')}" class="login-input"
        onkeydown="if(event.key==='Enter') doElyByLogin();" />

      <button onclick="doElyByLogin()" class="login-btn">
        <i class="fas fa-e"></i> ${t('common.login')}
      </button>
    </div>
  `;
}

export default { loginWithMicrosoft, loginWithOffline, loginWithElyBy };