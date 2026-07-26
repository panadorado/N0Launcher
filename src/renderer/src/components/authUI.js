export function loginWithMicrosoft() {
  return `
    <div class="login-card login-card--microsoft">
      <div class="login-card-overlay"></div>
      
      <div class="login-card-icon">
        <i class="fab fa-microsoft"></i>
      </div>
      
      <h3 class="login-card-title">Tài khoản Microsoft</h3>
      <p class="login-card-desc">Đăng nhập bằng tài khoản Mojang/Microsoft chính chủ.</p>
      
      <button onclick="doMicrosoftLogin()" class="login-btn">
        <i class="fab fa-microsoft"></i> Đăng nhập
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
      
      <h3 class="login-card-title">Chơi Offline</h3>
      <p class="login-card-desc">Nhập tên bất kỳ, không cần tài khoản.</p>
      
      <input id="offline-username" maxlength="16" placeholder="Nhập tên nhân vật..." class="login-input" />
      
      <button onclick="doOfflineLogin()" class="login-btn">
        <i class="fas fa-play"></i> Vào game
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
      
      <h3 class="login-card-title">Tài khoản ely.by</h3>
      <p class="login-card-desc">Đăng nhập bằng tài khoản ely.by (kèm skin/cape).</p>
      
      <input id="elyby-username" placeholder="Tên đăng nhập hoặc email" class="login-input" />
      <input id="elyby-password" type="password" placeholder="Mật khẩu" class="login-input"
        onkeydown="if(event.key==='Enter') doElyByLogin();" />
      
      <button onclick="doElyByLogin()" class="login-btn">
        <i class="fas fa-e"></i> Đăng nhập
      </button>
    </div>
  `;
}

export default { loginWithMicrosoft, loginWithOffline, loginWithElyBy };