const { app, BrowserWindow } = require('electron');
const { registerIpcHandlers } = require('./ipc');
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

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 798,
    minWidth: 1280,
    minHeight: 798,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../assets/N0Launcher.png')
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers(mainWindow);
  setupRendererLogging(mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});