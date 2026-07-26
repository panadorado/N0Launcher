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
        <h3 class="modal-title"><i class="fas fa-cube"></i> Cấu hình mới</h3>
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
        <label class="modal-label">Tên cấu hình (tuỳ chọn)</label>
        <input id="new-profile-name" type="text" placeholder="Ví dụ: Sinh tồn Forge 1.20.1" />

        <!-- Vanilla -->
        <div id="panel-vanilla" class="loader-panel">
          <div class="panel-box panel-vanilla">
            <p class="panel-desc"><i class="fas fa-cube"></i> Minecraft gốc — không có mod, ổn định nhất.</p>
            <div class="panel-checkboxes">
              <label class="panel-checkbox-label">
                <input type="checkbox" id="vanilla-show-release" checked onchange="window.reloadVanillaVersions()" /> Phát hành
              </label>
              <label class="panel-checkbox-label">
                <input type="checkbox" id="vanilla-show-snapshot" onchange="window.reloadVanillaVersions()" /> Bản thử nghiệm
              </label>
            </div>
            <select id="vanilla-version-select" class="panel-select">
              <option>Đang tải danh sách...</option>
            </select>
          </div>
        </div>

        <!-- Forge -->
        <div id="panel-forge" class="loader-panel">
          <div class="panel-box panel-forge">
            <p class="panel-desc"><i class="fas fa-hammer"></i> Forge — hệ mod lâu đời nhất, kho mod khổng lồ.</p>
            <label class="panel-select-label">Phiên bản Minecraft</label>
            <select id="forge-mc-select" onchange="window.reloadForgeBuilds()" class="panel-select">
              <option>Đang tải danh sách...</option>
            </select>
            <label class="panel-select-label">Phiên bản Forge</label>
            <select id="forge-build-select" class="panel-select">
              <option>Chọn phiên bản Minecraft trước</option>
            </select>
          </div>
        </div>

        <!-- NeoForge -->
        <div id="panel-neoforge" class="loader-panel">
          <div class="panel-box panel-neoforge">
            <p class="panel-desc"><i class="fas fa-fire"></i> NeoForge — nhánh kế thừa hiện đại, tối ưu hơn Forge cũ.</p>
            <label class="panel-select-label">Phiên bản Minecraft</label>
            <select id="neoforge-mc-select" onchange="window.reloadNeoForgeBuilds()" class="panel-select">
              <option>Đang tải danh sách...</option>
            </select>
            <label class="panel-select-label">Phiên bản NeoForge</label>
            <select id="neoforge-build-select" class="panel-select">
              <option>Chọn phiên bản Minecraft trước</option>
            </select>
          </div>
        </div>

        <!-- Fabric -->
        <div id="panel-fabric" class="loader-panel">
          <div class="panel-box panel-fabric">
            <p class="panel-desc"><i class="fas fa-layer-group"></i> Fabric — nhẹ, khởi động nhanh, hợp mod hiệu năng/công nghệ.</p>
            <label class="panel-select-label">Phiên bản Minecraft</label>
            <select id="fabric-mc-select" onchange="window.reloadFabricBuilds()" class="panel-select">
              <option>Đang tải danh sách...</option>
            </select>
            <label class="panel-select-label">Phiên bản Fabric Loader</label>
            <select id="fabric-build-select" class="panel-select">
              <option>Chọn phiên bản Minecraft trước</option>
            </select>
          </div>
        </div>

        <p id="new-profile-error">
          <i class="fas fa-circle-exclamation"></i> <span></span>
        </p>
      </div>

      <div class="modal-footer">
        <button onclick="window.closeNewProfileModal()" class="btn-cancel">Huỷ</button>
        <button onclick="window.submitNewProfile()" class="btn-create">
          <i class="fas fa-check"></i> Tạo cấu hình
        </button>
      </div>
    </div>
  </div>
  `;
}

export default renderNewProfileModal;