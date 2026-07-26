const path = require("path");
const fs = require("fs");

// Giữ console gốc để tránh đệ quy
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

const LOGGER_TYPE = 'EWID';
const LOGGER_DIR = '../../../../logs';

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

  const logFilePath = path.join(__dirname, LOGGER_DIR, `${level}-${dateTime}.log`);

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