import { recommendRamMB } from '../utils/ram.js';

export function renderSettings(config, lastProfile = null) {
  const ramMax = config?.memory?.max ?? 2048;
  const autoRam = !!config?.autoRecommendRam;
  const recommended = recommendRamMB(lastProfile);
  const useMirror = config?.network?.useMirror !== false;
  const proxy = config?.network?.proxy || '';

  return `
    <div class="settings-page">
      <div class="setting-container">

        <!-- Header -->
        <div class="settings-header">
          <h2 class="settings-title">
            <i class="fas fa-gear"></i> Cài đặt
          </h2>
          <div class="settings-underline"></div>
          <p class="settings-subtitle">Cấu hình đường dẫn game và bộ nhớ dùng khi khởi chạy.</p>
        </div>

        <div class="settings-cards">

          <!-- Card: Đường dẫn game -->
          <div class="settings-card">
            <div class="settings-card-header">
              <i class="fas fa-folder-open settings-card-icon-blue"></i>
              <label for="root-path" class="settings-card-title">Đường dẫn game</label>
            </div>

            <div class="path-row">
              <input id="root-path" value="${config.root}" readonly />
              <button onclick="chooseGameFolder()" class="btn-browse">
                <i class="fas fa-folder"></i> Duyệt...
              </button>
            </div>
            <p class="settings-hint">Thư mục chứa file game, thư viện và assets được tải về. Bấm "Duyệt..." để chọn.</p>
          </div>

          <!-- Card: RAM -->
          <div class="settings-card">
            <div class="settings-card-header between">
              <div class="settings-card-header" style="margin-bottom:0">
                <i class="fas fa-memory settings-card-icon-green"></i>
                <label for="ram-max" class="settings-card-title">RAM tối đa</label>
              </div>
              <span id="ram-display" class="ram-value">${ramMax} MB</span>
            </div>

            <input id="ram-max" type="range" min="512" max="16384" step="256" value="${ramMax}" ${autoRam ? 'disabled' : ''}
                  oninput="document.getElementById('ram-display').textContent = this.value + ' MB';" />

            <div class="ram-range-labels">
              <span>512 MB</span>
              <span>16 GB</span>
            </div>
            <p class="settings-hint">Kéo thanh trượt để điều chỉnh. RAM càng cao giúp game chạy mượt hơn với shader/mod nặng, nhưng cần máy đủ bộ nhớ.</p>

            <label class="auto-ram-label">
              <input id="auto-ram-recommend" type="checkbox" ${autoRam ? 'checked' : ''} onchange="window.toggleAutoRam()" />
              Tự động đề xuất RAM theo phiên bản đang chọn
              <span class="auto-ram-hint">(${lastProfile ? `gợi ý ${recommended} MB cho "${lastProfile.name}"` : 'chưa có cấu hình nào được chọn'})</span>
            </label>
          </div>

          <!-- Card: Kiểm tra Java -->
          <div class="settings-card">
            <div class="settings-card-header between">
              <div class="settings-card-header" style="margin-bottom:0">
                <i class="fas fa-mug-hot settings-card-icon-amber"></i>
                <label class="settings-card-title">Java</label>
              </div>
              <button onclick="window.checkJavaStatus()" class="btn-check">
                <i class="fas fa-magnifying-glass"></i> Kiểm tra Java
              </button>
            </div>
            <div id="java-status">
              Bấm "Kiểm tra Java" để xem Java hiện có trên máy có tương thích với cấu hình đang chọn không.
            </div>
          </div>

          <!-- Card: Mạng & Mirror -->
          <div class="settings-card">
            <div class="settings-card-header">
              <i class="fas fa-tower-broadcast settings-card-icon-cyan"></i>
              <label class="settings-card-title">Mạng &amp; Mirror tải xuống</label>
            </div>

            <label class="network-label">
              <input id="use-mirror" type="checkbox" ${useMirror ? 'checked' : ''} />
              Tự động chuyển sang mirror dự phòng khi máy chủ Mojang chậm/lỗi
            </label>
            <p class="settings-hint" style="margin-bottom:1rem">Hữu ích khi kết nối tới Mojang không ổn định. Chỉ dùng làm dự phòng — launcher vẫn ưu tiên nguồn chính thức trước.</p>

            <label for="proxy-url" class="proxy-label">Proxy (không bắt buộc)</label>
            <input id="proxy-url" type="text" value="${proxy}" placeholder="http://host:port hoặc socks5://host:port" />
            <p class="settings-hint">Để trống nếu không dùng proxy/VPN riêng cho launcher.</p>

            <button onclick="window.checkMirrorsStatus()" class="btn-check cyan" style="margin-top:1rem">
              <i class="fas fa-satellite-dish"></i> Kiểm tra kết nối mirror
            </button>
            <div id="mirror-status"></div>
          </div>

        </div>

        <!-- Nút lưu + thông báo -->
        <div class="settings-actions">
          <button onclick="saveSettings()" class="btn-save-settings">
            <i class="fas fa-floppy-disk"></i> Lưu cài đặt
          </button>
          <span id="settings-toast">
            <i class="fas fa-check-circle"></i> Đã lưu cài đặt!
          </span>
        </div>

      </div>
    </div>
  `;
}

export default renderSettings;