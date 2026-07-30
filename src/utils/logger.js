const path = require("path");
const fs = require("fs");
const os = require("os");
const { app } = require("electron");

// Giữ console gốc để tránh đệ quy
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

const LOGGER_TYPE = 'EWID';

// Dùng thư mục logs chuẩn của Electron (luôn có quyền ghi, không phụ thuộc
// launcher được cài ở đâu) thay vì dò ngược __dirname — cách cũ có thể trỏ
// vào Program Files khi đóng gói, nơi tiến trình không có quyền ghi.
// app.getPath('logs') có thể ném lỗi nếu gọi trước khi app 'ready' (ví dụ
// một exception xảy ra rất sớm khi khởi động) — fallback về thư mục tạm để
// logger không bao giờ là nguyên nhân khiến launcher crash.
function getLogFilePath(level, dateTime) {
  let dir;
  try {
    dir = app.getPath('logs');
  } catch (e) {
    dir = path.join(os.tmpdir(), 'N0Launcher-logs');
  }
  return path.join(dir, `${level}-${dateTime}.log`);
}

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function _isEnableLog(char) {
  return LOGGER_TYPE.toUpperCase().indexOf(char) !== -1;
}

module.exports = function logger(level, message, printToConsole = true) {
  const timestamp = new Date().toISOString();
  const dateTime = new Date()
    .toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })
    .replace(/\//g, "_");

  const logFilePath = getLogFilePath(level, dateTime);

  ensureDirectoryExistence(logFilePath);

  const logMessage = `[${timestamp}]: [${level}] ${message}\n`;

  // Ghi file
  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (err) {
    originalConsole.error(`[LOGGER] Lỗi ghi file: ${err.message}`);
  }

  // In console (sử dụng console gốc để tránh recursion)
  if (printToConsole) {
    switch (level) {
      case "ERROR":
        if (_isEnableLog("E")) originalConsole.error(logMessage.trim());
        break;
      case "WARN":
        if (_isEnableLog("W")) originalConsole.warn(logMessage.trim());
        break;
      case "INFO":
        if (_isEnableLog("I")) originalConsole.log(logMessage.trim());
        break;
      case "DEBUG":
        if (_isEnableLog("D")) originalConsole.log(logMessage.trim());
        break;
      default:
        originalConsole.log(logMessage.trim());
    }
  }
};