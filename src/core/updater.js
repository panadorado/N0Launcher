const { autoUpdater } = require('electron-updater');
const logger = require('../utils/logger');

// Tự tải off, chỉ tải khi người dùng bấm "Cập nhật ngay" — đúng yêu cầu "cho
// phép người dùng đồng ý hoặc không" thay vì tự ý tải/cài ngầm.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

autoUpdater.logger = {
  info: (msg) => logger('INFO', `[updater] ${msg}`),
  warn: (msg) => logger('WARN', `[updater] ${msg}`),
  error: (msg) => logger('ERROR', `[updater] ${msg}`),
  debug: () => {},
};

// electron-builder set biến môi trường này khi chạy từ bản "portable" — bản
// đó không có bước cài đặt nên electron-updater không thể tự thay thế file
// đang chạy. Phải phát hiện để báo người dùng tải thủ công thay vì hiện nút
// cập nhật rồi lỗi giữa chừng.
function isPortableBuild() {
  return !!process.env.PORTABLE_EXECUTABLE_FILE;
}

let listenersAttached = false;

function setupUpdater(onStatus) {
  if (listenersAttached) return;
  listenersAttached = true;

  autoUpdater.on('checking-for-update', () => onStatus({ status: 'checking' }));
  autoUpdater.on('update-available', (info) => onStatus({ status: 'available', version: info?.version }));
  autoUpdater.on('update-not-available', (info) => onStatus({ status: 'not-available', version: info?.version }));
  autoUpdater.on('download-progress', (progress) => onStatus({
    status: 'downloading',
    percent: Math.round(progress.percent || 0),
    bytesPerSecond: progress.bytesPerSecond,
    transferred: progress.transferred,
    total: progress.total,
  }));
  autoUpdater.on('update-downloaded', (info) => onStatus({ status: 'downloaded', version: info?.version }));
  autoUpdater.on('error', (err) => onStatus({ status: 'error', message: err?.message || String(err) }));
}

async function checkForUpdates() {
  if (isPortableBuild()) {
    throw new Error('Bản portable không hỗ trợ tự động cập nhật. Vui lòng tải bản cài đặt (.exe) mới nhất thủ công.');
  }
  return autoUpdater.checkForUpdates();
}

async function downloadUpdate() {
  if (isPortableBuild()) {
    throw new Error('Bản portable không hỗ trợ tự động cập nhật. Vui lòng tải bản cài đặt (.exe) mới nhất thủ công.');
  }
  return autoUpdater.downloadUpdate();
}

function quitAndInstall() {
  autoUpdater.quitAndInstall();
}

module.exports = { setupUpdater, checkForUpdates, downloadUpdate, quitAndInstall, isPortableBuild };
