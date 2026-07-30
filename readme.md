# N0Launcher

**N0Launcher** là một Minecraft Launcher được custom cá nhân, xây dựng trên nền tảng **Electron + Node.js**, giao diện tối giản, hiện đại và tập trung vào trải nghiệm sử dụng mượt mà.

---

## Tính năng chính

  - Giao diện dark theme đẹp mắt, dễ sử dụng.
  - Hỗ trợ tiếng Việt hoàn toàn.
  - Hỗ trợ **Vanilla**, **Forge**, **NeoForge**, **Fabric**.
  - Tạo cấu hình mới dễ dàng (phiên bản chính thức / thử nghiệm).
  - Quản lý nhiều cấu hình (instance) khác nhau.
  - Bật/tắt mod nhanh chóng bằng công tắc.
  - Mở thư mục mods trực tiếp từ launcher.
  - Hỗ trợ Resource Packs.
  - Điều chỉnh RAM tối đa (tự động đề xuất theo phiên bản).
  - Kiểm tra Java tương thích.
  - Hỗ trợ Mirror tải xuống (tự động chuyển khi Mojang chậm/lỗi).
  - Hỗ trợ Proxy (tùy chọn).
  - Hỗ trợ đăng nhập Microsoft (Online) và Offline.
  - Nút “Bắt đầu” lớn, dễ nhìn.
  - Xem trước phiên bản đang chọn.

---

### Core Dependencies

| Package | Link chính thức |
|---------|-----------------|
| **@xmcl/core** | [npm](https://www.npmjs.com/package/@xmcl/core) · [GitHub](https://github.com/Voxelum/minecraft-launcher-core-node) |
| **@xmcl/installer** | [npm](https://www.npmjs.com/package/@xmcl/installer) |
| **@xmcl/mod-parser** | [npm](https://www.npmjs.com/package/@xmcl/mod-parser) |
| **@xmcl/resourcepack** | [npm](https://www.npmjs.com/package/@xmcl/resourcepack) |
| **@xmcl/task** | [npm](https://www.npmjs.com/package/@xmcl/task) |
| **minecraft-launcher-core**  | [npm](https://www.npmjs.com/package/minecraft-launcher-core) · [GitHub](https://github.com/Pierce01/MinecraftLauncher-core) |
| **msmc** |  [npm](https://www.npmjs.com/package/msmc) |
| **prismarine-auth** | [GitHub](https://github.com/PrismarineJS/prismarine-auth) |
| **adm-zip** |  [npm](https://www.npmjs.com/package/adm-zip) |
| **fs-extra** | [npm](https://www.npmjs.com/package/fs-extra) |
| **undici** |  [npm](https://www.npmjs.com/package/undici) |

### Dev Dependencies

| Package | Link chính thức |
|---------|-----------------|
| **Electron**  | [Website](https://www.electronjs.org/) · [GitHub](https://github.com/electron/electron) |
| **electron-builder**  | [Website](https://www.electron.build/) · [GitHub](https://github.com/electron-userland/electron-builder) |
| **Vite** | [Website](https://vitejs.dev/) |
| **javascript-obfuscator**  | [npm](https://www.npmjs.com/package/javascript-obfuscator) |
| **X Minecraft Launcher**  | [Website](https://xmcl.app/en/)

---

## Chú ý

Vì N0Launcher được phát triển bởi **một cá nhân** (không phải team lớn), nên hiện tại vẫn còn một số hạn chế:

- **Tính năng còn hạn chế** so với các launcher lớn (Prism Launcher, XMCL, MultiMC...).
- **Chưa hỗ trợ** CurseForge / Modrinth tích hợp sẵn (phải tải mod thủ công).
- **Chưa hỗ trợ** Quilt, OptiFine, LabyMod... đầy đủ.
- **Giao diện** còn đơn giản, thiếu nhiều tùy chỉnh nâng cao.
- **Hỗ trợ** chỉ tập trung vào Windows (macOS & Linux chưa được kiểm thử kỹ).
- Có thể gặp lỗi nhỏ khi Minecraft cập nhật version mới (vì phụ thuộc vào các core library).

---

## Cài đặt & Sử dụng

1. Tải bản phát hành mới nhất từ [Releases](https://github.com/panadorado/minecraft_n0launcher/releases/tag/v1.0.3).
2. Giải nén / cài đặt.
3. Chạy `N0Launcher.exe`.
4. Đăng nhập Microsoft hoặc dùng Offline.
5. Tạo cấu hình phiên bản → thêm mods (nếu cần) → Bắt đầu chơi!

---

## Đóng góp & Phản hồi

Đây là dự án cá nhân, nhưng rất vui nếu bạn:

- Báo lỗi (Issue)
- Góp ý tính năng
- Star repo nếu thấy hữu ích

---

**N0Launcher** — Launcher nhỏ gọn, đủ dùng, dành cho những ai thích sự đơn giản.