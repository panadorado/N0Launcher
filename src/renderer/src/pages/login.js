import { t } from '../i18n/index.js';

// Trang tài khoản / đăng nhập. Chạy trong renderer (browser), không cần Node/IPC.
export function renderLogin(currentAccount, auth) {
  return `
    <div class="login-page">
      <div class="login-container">

        <!-- Header -->
        <div class="login-header">
          <h2 class="login-title">
            <i class="fas fa-user"></i>
            ${t('login.title')}
          </h2>
          <div class="login-underline"></div>
          <p class="login-subtitle">${t('login.subtitle')}</p>
        </div>

        <!-- Cards Container -->
        <div class="login-cards">
          ${auth.loginWithMicrosoft()}
          ${auth.loginWithElyBy()}
          ${auth.loginWithOffline()}
        </div>

        <!-- Error Alert -->
        <div id="login-error">
          <div class="login-error-icon">
            <i class="fas fa-triangle-exclamation"></i>
          </div>
          <p id="login-error-text"></p>
          <button onclick="dismissLoginError()" class="login-error-close">
            <i class="fas fa-xmark"></i>
          </button>
        </div>

      </div>
    </div>

    ${renderMsaDeviceModal()}
  `;
}

// Modal hiện mã đăng nhập Microsoft (device code flow) — thay cho cửa sổ
// popup nhúng cũ. Không có form nhập mật khẩu nào ở đây: người dùng tự mở
// trình duyệt hệ thống (nút bên dưới) và nhập mã trên chính trang của
// Microsoft, launcher chỉ hiển thị + chờ kết quả.
function renderMsaDeviceModal() {
  return `
    <div id="msa-device-modal">
      <div class="modal-box msa-device-box">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fab fa-microsoft"></i> ${t('msa.modal.title')}</h3>
          <button onclick="window.cancelMsaLogin()" class="modal-close-btn">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <div class="msa-device-body">
          <p class="msa-device-desc">${t('msa.modal.desc')}</p>
          <div class="msa-device-code-row">
            <span id="msa-device-code">------</span>
            <button onclick="window.copyMsaCode()" title="Sao chép mã" class="btn-msa-copy">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <button onclick="window.openMsaLoginPage()" class="btn-msa-open">
            <i class="fas fa-arrow-up-right-from-square"></i> ${t('msa.modal.openButton')}
          </button>
          <p class="msa-device-status">
            <i class="fas fa-spinner fa-spin"></i> ${t('msa.modal.waiting')}
          </p>
        </div>
        <div class="modal-footer">
          <button onclick="window.cancelMsaLogin()" class="btn-cancel">${t('common.cancel')}</button>
        </div>
      </div>
    </div>
  `;
}

export default renderLogin;