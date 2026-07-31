const { app, BrowserWindow } = require('electron');
const { registerIpcHandlers } = require('../controller/ipc');
const { loadConfig } = require('../core/config');
const { checkForUpdates } = require('../core/updater');
const path = require('path');

// ====================== KHỞI TẠO LOGGER ======================
const logger = require('../utils/logger');

function serialize(value) {
  if (value instanceof Error) {
    const base = {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    if (value.cause) base.cause = serialize(value.cause);
    if (Array.isArray(value.errors)) {
      // AggregateError.errors — danh sách các lỗi con gộp lại.
      base.errors = value.errors.map(serialize);
    }
    return base;
  }
  return value;
}

// Override console
console.log = (...args) => {
  const msg = args.map(a => typeof a === 'object' && a !== null ? JSON.stringify(serialize(a), null, 2) : a).join(' ');
  logger('INFO', msg);
};

console.info = (...args) => {
  const msg = args.map(a => typeof a === 'object' && a !== null ? JSON.stringify(serialize(a), null, 2) : a).join(' ');
  logger('INFO', msg);
};

console.warn = (...args) => {
  const msg = args.map(a => typeof a === 'object' && a !== null ? JSON.stringify(serialize(a), null, 2) : a).join(' ');
  logger('WARN', msg);
};

console.error = (...args) => {
  const msg = args.map(a => typeof a === 'object' && a !== null ? JSON.stringify(serialize(a), null, 2) : a).join(' ');

  // Bỏ qua các deprecation warning
  if (msg.includes('DeprecationWarning') || msg.includes('DEP0040') || msg.includes('punycode')) return;

  logger('ERROR', msg);
};

console.debug = (...args) => {
  const msg = args.map(a => typeof a === 'object' && a !== null ? JSON.stringify(serialize(a), null, 2) : a).join(' ');
  logger('DEBUG', msg);
};

// ====================== Bắt lỗi process ======================
process.on('uncaughtException', (err) => logger('ERROR', `Uncaught Exception: ${err.message}\n${err.stack}`));
process.on('unhandledRejection', (reason) => logger('ERROR', `Unhandled Rejection: ${reason}`));

// ====================== Renderer Console ======================
function setupRendererLogging(win) {
  win.webContents.on('console-message', (event) => {
    const { level, message, lineNumber, sourceId } = event;
    const levels = { 0: 'DEBUG', 1: 'INFO', 2: 'WARN', 3: 'ERROR' };
    const logLevel = levels[level] || 'INFO';
    logger(logLevel, `${message} (${sourceId}:${lineNumber})`);
  });
}

// Yêu cầu khóa single instance
const gotTheLock = app.requestSingleInstanceLock();
const openDevTool = false;

if (!gotTheLock) {
  app.quit();
} else {
  // Khi người dùng cố mở instance thứ 2
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Focus cửa sổ chính nếu đã mở
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  let mainWindow; 
  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 798,
      minWidth: 1280,
      minHeight: 798,
      autoHideMenuBar: true,
      webPreferences: {
        devTools: openDevTool,
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      },
      icon: path.join(__dirname, '../assets/N0Launcher.png')
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    if(openDevTool) mainWindow.webContents.openDevTools();

    // Giải nén/tải file lớn (native libs, assets, Forge/NeoForge installer...)
    // có thể đẩy renderer tới giới hạn bộ nhớ và khiến tiến trình renderer bị
    // hệ điều hành/Chromium kill — nếu không bắt sự kiện này, cửa sổ sẽ đứng
    // im/trắng mà không rõ lý do. Log nguyên nhân và tự tải lại thay vì để
    // launcher trông như bị treo/crash.
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
      logger('ERROR', `Renderer process gone: reason=${details.reason} exitCode=${details.exitCode}`);
      if (details.reason !== 'clean-exit' && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.reload();
      }
    });

    mainWindow.webContents.on('unresponsive', () => {
      logger('WARN', 'Cửa sổ chính tạm thời không phản hồi (có thể do tác vụ giải nén/tải nặng đang chạy).');
    });

    mainWindow.webContents.on('responsive', () => {
      logger('INFO', 'Cửa sổ chính đã phản hồi trở lại.');
    });
  }

  // Tiến trình phụ (GPU, network service, tiện ích...) bị crash không làm
  // chết app chính, nhưng vẫn nên ghi log để biết nguyên nhân nếu launcher
  // có dấu hiệu bất ổn trong lúc giải nén/tải.
  app.on('child-process-gone', (_event, details) => {
    logger('ERROR', `Child process gone: type=${details.type} reason=${details.reason}`);
  });

  app.whenReady().then(() => {
    createWindow();
    registerIpcHandlers(mainWindow);
    setupRendererLogging(mainWindow);

    // Tự kiểm tra cập nhật lúc khởi động (nếu người dùng không tắt trong Cài
    // đặt) — chỉ KIỂM TRA, không tự tải/cài; renderer quyết định có hỏi
    // người dùng hay không dựa trên config.updateCheck.dismissedVersion.
    // Trễ vài giây để không cạnh tranh băng thông/CPU với lúc cửa sổ đang
    // khởi tạo, và lỗi mạng ở đây không được phép làm hỏng khởi động app.
    setTimeout(() => {
      const config = loadConfig();
      if (config.updateCheck?.checkOnStartup === false) return;
      checkForUpdates().catch((e) => logger('WARN', `[updater] Kiểm tra cập nhật lúc khởi động thất bại: ${e?.message}`));
    }, 5000);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}