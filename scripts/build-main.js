const fs = require("fs-extra");

const srcArrCopy = [
  { src: "src/main", dest: "dist/main" },
  { src: "src/preload", dest: "dist/preload" },
  { src: "src/core", dest: "dist/core" },
  { src: "src/controller", dest: "dist/controller" },
  { src: "src/utils", dest: "dist/utils" },
  { src: "src/i18n", dest: "dist/i18n" },
  { src: "src/renderer/assets/icons", dest: "dist/renderer/assets/icons" },
  {
    src: "src/renderer/assets/N0Launcher.png",
    dest: "dist/assets/N0Launcher.png",
  },
  {
    src: "src/renderer/assets/N0Launcher.ico",
    dest: "dist/assets/N0Launcher.ico",
  },
];

async function copyMainFiles() {
  console.log("📁 Đang copy main, preload & core...");

  for (const { src, dest } of srcArrCopy) {
    await fs.copy(src, dest, { overwrite: true });
  }
  // Icon dùng bởi main process (BrowserWindow icon) không được Vite build vì
  // không có file nào trong renderer tham chiếu tới nó bằng import/url(). Copy
  // thủ công vào dist/assets để main/index.js có thể load được sau khi đóng gói
  // (khi package chỉ chứa dist/**, không còn src/**).
  await fs.copy(
    "src/renderer/assets/N0Launcher.png",
    "dist/assets/N0Launcher.png",
    { overwrite: true },
  );
  await fs.copy(
    "src/renderer/assets/N0Launcher.ico",
    "dist/assets/N0Launcher.ico",
    { overwrite: true },
  );

  console.log("✅ Copy thành công!");
}

copyMainFiles().catch(console.error);
