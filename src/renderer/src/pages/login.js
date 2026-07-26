// Trang tài khoản / đăng nhập. Chạy trong renderer (browser), không cần Node/IPC.
export function renderLogin(currentAccount, auth) {
  return `
    <div class="login-page">
      <div class="login-container">
        
        <!-- Header -->
        <div class="login-header">
          <h2 class="login-title">Tài khoản</h2>
          <div class="login-underline"></div>
          <p class="login-subtitle">Chọn cách đăng nhập để bắt đầu chơi</p>
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
  `;
}

export default renderLogin;