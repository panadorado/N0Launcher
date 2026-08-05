# N0Launcher – Minecraft Launcher tối giản & hiện đại

**N0Launcher** là Minecraft Launcher mã nguồn mở được xây dựng bằng **Electron + Node.js**, giao diện tối giản, hoàn toàn tiếng Việt, hỗ trợ **Vanilla · Forge · NeoForge · Fabric**.

[![GitHub Release](https://img.shields.io/github/v/release/panadorado/N0Launcher?style=for-the-badge&logo=github)](https://github.com/panadorado/N0Launcher/releases)
[![GitHub Stars](https://img.shields.io/github/stars/panadorado/N0Launcher?style=for-the-badge)](https://github.com/panadorado/N0Launcher/stargazers)
[![Downloads](https://img.shields.io/github/downloads/panadorado/N0Launcher/total?style=for-the-badge)](https://github.com/panadorado/N0Launcher/releases)
[![License](https://img.shields.io/github/license/panadorado/N0Launcher?style=for-the-badge)](LICENSE)

> **N0Launcher** – Minecraft Launcher cá nhân tối giản, hiện đại dành cho người chơi Việt Nam.  
> Hỗ trợ đăng nhập **Microsoft · Ely.by · Offline**, quản lý mods & resource packs ngay trong app.

---

## ✨ Tính năng nổi bật của N0Launcher

- 🎮 **Hỗ trợ đầy đủ modloader**: Vanilla, **Forge**, **NeoForge**, **Fabric**
- 🔐 Đăng nhập Microsoft (device code – an toàn), Ely.by và Offline
- 🌐 Giao diện **đa ngôn ngữ** (Tiếng Việt / English)
- 🧩 Quản lý mods dễ dàng (bật/tắt bằng công tắc, mở thư mục mods)
- 🎨 Hỗ trợ Resource Packs
- 💾 Điều chỉnh RAM tự động đề xuất theo phiên bản
- ☕ Tự động kiểm tra & tải Java tương thích (kể cả Java 8 cho Forge cũ)
- 🚀 Mirror tải xuống thông minh (tự chuyển khi Mojang chậm/lỗi)
- 🌐 Hỗ trợ Proxy
- 🔄 Tự động cập nhật launcher
- 💻 Hỗ trợ Windows (chính thức) + thử nghiệm Linux

---

## 📥 Tải N0Launcher (Download)

**Cách nhanh nhất:**

1. Vào trang [**Releases**](https://github.com/panadorado/N0Launcher/releases)
2. Tải file **N0Launcher Setup** phiên bản mới nhất (`.exe`)
3. Chạy installer → Mở launcher → Đăng nhập → Tạo cấu hình → Chơi!

> Khuyến nghị dùng bản **Setup** để cài đặt sạch sẽ.

---

## 🖼️ Giao diện N0Launcher

| Đăng nhập | Giao diện chính | Quản lý Mods |
|-----------|------------------|--------------|
| ![Login](https://github.com/panadorado/n0launcher-blog/blob/main/assets%2Fslider%2Fslider-1.png) | ![Main](https://github.com/panadorado/n0launcher-blog/blob/main/assets%2Fslider%2Fslider-2.png) | ![Mods](https://github.com/panadorado/n0launcher-blog/blob/main/assets%2Fslider%2Fslider-3.png) |

---

## 🛠️ Cài đặt từ mã nguồn (Build from source)

```bash
# Clone repo
git clone https://github.com/panadorado/N0Launcher.git
cd N0Launcher

# Cài đặt dependencies
npm install

# Chạy chế độ development
npm start

# Build production (Windows)
npm run build