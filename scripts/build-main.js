const fs = require('fs-extra');

async function copyMainFiles() {
  console.log('📁 Đang copy main, preload & core...');

  await fs.copy('src/main', 'dist/main', { overwrite: true });
  await fs.copy('src/preload', 'dist/preload', { overwrite: true });
  await fs.copy('src/core', 'dist/core', { overwrite: true });   // ← Thêm dòng này
  await fs.copy('src/controller', 'dist/controller', { overwrite: true });
  await fs.copy('src/utils', 'dist/utils', { overwrite: true });
  // Icon dùng bởi main process (BrowserWindow icon) không được Vite build vì
  // không có file nào trong renderer tham chiếu tới nó bằng import/url(). Copy
  // thủ công vào dist/assets để main/index.js có thể load được sau khi đóng gói
  // (khi package chỉ chứa dist/**, không còn src/**).
  await fs.copy('src/renderer/assets/N0Launcher.png', 'dist/assets/N0Launcher.png', { overwrite: true });
  await fs.copy('src/renderer/assets/N0Launcher.ico', 'dist/assets/N0Launcher.ico', { overwrite: true });
  // await fs.copy('src/renderer/assets/image-cover.jpg', 'dist/assets/image-cover.jpg', { overwrite: true });

  console.log('✅ Copy thành công!');
}

copyMainFiles().catch(console.error);