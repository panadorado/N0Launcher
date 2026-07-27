# N0Launcher

**N0Launcher** là một Minecraft Launcher được custom cá nhân, xây dựng trên nền tảng **Electron + Node.js**, giao diện tối giản, hiện đại và tập trung vào trải nghiệm sử dụng mượt mà.

---

## Tính năng chính

- **Giao diện hiện đại & tối giản**
  - Giao diện dark theme đẹp mắt, dễ sử dụng.
  - Hỗ trợ tiếng Việt hoàn toàn.

- **Quản lý phiên bản linh hoạt**
  - Hỗ trợ **Vanilla**, **Forge**, **NeoForge**, **Fabric**.
  - Tạo cấu hình mới dễ dàng (phiên bản chính thức / thử nghiệm).
  - Quản lý nhiều cấu hình (instance) khác nhau.

- **Quản lý Mods & Resource Packs**
  - Bật/tắt mod nhanh chóng bằng công tắc.
  - Mở thư mục mods trực tiếp từ launcher.
  - Hỗ trợ Resource Packs.

- **Cài đặt nâng cao**
  - Điều chỉnh RAM tối đa (tự động đề xuất theo phiên bản).
  - Kiểm tra Java tương thích.
  - Hỗ trợ Mirror tải xuống (tự động chuyển khi Mojang chậm/lỗi).
  - Hỗ trợ Proxy (tùy chọn).

- **Đăng nhập**
  - Hỗ trợ đăng nhập Microsoft (Online) 
  - Hổ trợ đăng nhập Ely.by (Online) 
  - Chơi Offline chỉ với tên đăng nhập

- **Khởi chạy nhanh**
  - Nút “Bắt đầu” lớn, dễ nhìn.
  - Xem trước phiên bản đang chọn.

---

### Core Dependencies

| Package | Mô tả | Link chính thức |
|---------|-------|-----------------|
| **@xmcl/core** | Core chức năng parse version & launch Minecraft | [npm](https://www.npmjs.com/package/@xmcl/core) · [GitHub](https://github.com/Voxelum/minecraft-launcher-core-node) |
| **@xmcl/installer** | Cài đặt Minecraft, Forge, NeoForge, Fabric, assets, libraries | [npm](https://www.npmjs.com/package/@xmcl/installer) |
| **@xmcl/mod-parser** | Parse thông tin mod (Forge/Fabric/NeoForge...) | [npm](https://www.npmjs.com/package/@xmcl/mod-parser) |
| **@xmcl/resourcepack** | Xử lý Resource Pack | [npm](https://www.npmjs.com/package/@xmcl/resourcepack) |
| **@xmcl/task** | Quản lý task & progress | [npm](https://www.npmjs.com/package/@xmcl/task) |
| **minecraft-launcher-core** | Core launch Minecraft (MCLC) | [npm](https://www.npmjs.com/package/minecraft-launcher-core) · [GitHub](https://github.com/Pierce01/MinecraftLauncher-core) |
| **msmc** | Đăng nhập Microsoft Account | [npm](https://www.npmjs.com/package/msmc) |
| **adm-zip** | Xử lý file ZIP | [npm](https://www.npmjs.com/package/adm-zip) |
| **fs-extra** | Thao tác file hệ thống nâng cao | [npm](https://www.npmjs.com/package/fs-extra) |
| **undici** | HTTP client hiệu suất cao | [npm](https://www.npmjs.com/package/undici) |

### Dev Dependencies

| Package | Mô tả | Link chính thức |
|---------|-------|-----------------|
| **Electron** | Framework xây dựng ứng dụng desktop | [Website](https://www.electronjs.org/) · [GitHub](https://github.com/electron/electron) |
| **electron-builder** | Đóng gói & phân phối ứng dụng | [Website](https://www.electron.build/) · [GitHub](https://github.com/electron-userland/electron-builder) |
| **Vite** | Build tool nhanh | [Website](https://vitejs.dev/) |
| **javascript-obfuscator** | Bảo vệ mã nguồn | [npm](https://www.npmjs.com/package/javascript-obfuscator) |
| **X Minecraft Launcher** | Trình khởi chạy Minecraft mã nguồn mở với giao diện người dùng hiện đại. | [Website](https://xmcl.app/en/)

---

## Lưu Ý

Vì N0Launcher được phát triển bởi **một cá nhân** (không phải team lớn), nên hiện tại vẫn còn một số hạn chế:

- **Tính năng còn hạn chế** so với các launcher lớn (Prism Launcher, XMCL, MultiMC...).
- **Chưa hỗ trợ** CurseForge / Modrinth tích hợp sẵn (phải tải mod thủ công).
- **Chưa có** hệ thống cập nhật tự động hoàn chỉnh.
- **Chưa hỗ trợ** Quilt, OptiFine, LabyMod... đầy đủ.
- **Giao diện** còn đơn giản, thiếu nhiều tùy chỉnh nâng cao.
- **Hỗ trợ** chỉ tập trung vào Windows (macOS & Linux chưa được kiểm thử kỹ).
- Có thể gặp lỗi nhỏ khi Minecraft cập nhật version mới (vì phụ thuộc vào các core library).

Launcher sẽ được cập nhật dần theo thời gian rảnh của tác giả.

---

## Cài đặt & Sử dụng

1. Tải bản phát hành mới nhất từ [Releases](https://github.com/panadorado/minecraft_n0launcher/releases/tag/v1.0.2).
2. Giải nén / cài đặt.
3. Chạy `N0Launcher.exe`.
4. Đăng nhập Microsoft hoặc dùng Ely.by, Offline.
5. Tạo cấu hình phiên bản → thêm mods (nếu cần) → Bắt đầu chơi!

---

## Đóng góp & Phản hồi

Đây là dự án cá nhân, nhưng rất vui nếu bạn:

- Báo lỗi (Issue)
- Góp ý tính năng
- Star repo nếu thấy hữu ích

---

**N0Launcher** — Launcher nhỏ gọn, đủ dùng, dành cho những ai thích sự đơn giản.