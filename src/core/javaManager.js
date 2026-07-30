const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { app } = require('electron');
const { CancelledError } = require('@xmcl/task');
const { fetchJavaRuntimeManifest, installJavaRuntimeTask } = require('@xmcl/installer');
const { isCancelRequested, registerActiveTask, unregisterActiveTask } = require('./installer');
const { getNetworkOptions } = require('./network');

// Chuyển sang đây từ launcher.js (thay vì launcher.js require ngược lại
// javaManager.js) để tránh phụ thuộc vòng: ensureJavaRuntime bên dưới cần
// hàm này để tự kiểm tra xem bản Java ĐÃ CÀI SẴN có thực sự đủ major version
// yêu cầu hay không, chứ không chỉ dựa vào việc file đã tồn tại.
function parseJavaMajorVersion(versionOutput) {
  const match = versionOutput.match(/version "(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  const first = parseInt(match[1], 10);
  if (first === 1 && match[2]) return parseInt(match[2], 10);
  return first;
}

function getInstalledJavaMajorVersion(javaPath) {
  return new Promise((resolve) => {
    execFile(javaPath, ['-version'], (err, stdout, stderr) => {
      if (err) return resolve(null);
      resolve(parseJavaMajorVersion(`${stdout}\n${stderr}`));
    });
  });
}

function javaRuntimeDir(component) {
  return path.join(app.getPath('userData'), 'java', component);
}

function javaExecutablePath(component) {
  const dir = javaRuntimeDir(component);
  if (process.platform === 'win32') return path.join(dir, 'bin', 'java.exe');
  // Bản Java cho macOS được Mojang đóng gói dạng "bundle"
  if (process.platform === 'darwin') return path.join(dir, 'jre.bundle', 'Contents', 'Home', 'bin', 'java');
  return path.join(dir, 'bin', 'java');
}

function isJavaRuntimeInstalled(component) {
  return fs.existsSync(javaExecutablePath(component));
}

function guessJavaComponent(requiredJavaMajor) {
  if (requiredJavaMajor >= 21) return 'java-runtime-delta';
  if (requiredJavaMajor >= 17) return 'java-runtime-gamma';
  if (requiredJavaMajor >= 16) return 'java-runtime-alpha';
  return 'jre-legacy';
}

// `requiredMajor` (tuỳ chọn): nếu component ĐÃ cài sẵn nhưng bản Java bên
// trong lại KHÔNG đủ major version yêu cầu (Mojang có thể cập nhật nội dung
// của cùng 1 component sang Java version mới hơn theo thời gian — ví dụ
// "java-runtime-delta" hôm nay là Java 21, nhưng bản cài trước đó của người
// dùng có thể chỉ là Java 17), xoá bản cũ và tải lại thay vì dùng mãi bản cũ
// không tương thích rồi báo lỗi launch mỗi lần.
async function ensureJavaRuntime(component, onProgress = () => {}, requiredMajor = null) {
  if (isJavaRuntimeInstalled(component)) {
    const exePath = javaExecutablePath(component);
    if (!requiredMajor) return exePath;

    const installedMajor = await getInstalledJavaMajorVersion(exePath);
    if (installedMajor && installedMajor >= requiredMajor) return exePath;

    console.warn(`[javaManager] Java runtime '${component}' đã cài (Java ${installedMajor}) nhưng không đủ Java ${requiredMajor}+ yêu cầu — xoá và tải lại bản mới.`);
    try {
      fs.rmSync(javaRuntimeDir(component), { recursive: true, force: true });
    } catch (e) {
      console.error(`[javaManager] Không thể xoá bản Java cũ '${component}':`, e?.message);
    }
  }

  if (isCancelRequested()) throw new CancelledError();

  onProgress({ phase: 'downloading', percent: 0, label: `Đang tải Java (${component})...` });

  const netOptions = getNetworkOptions();
  const manifest = await fetchJavaRuntimeManifest({ target: component, ...netOptions });
  const destination = javaRuntimeDir(component);
  fs.mkdirSync(destination, { recursive: true });

  const rootTask = installJavaRuntimeTask({ destination, manifest, ...netOptions });
  registerActiveTask(rootTask);

  try {
    await rootTask.startAndWait({
      onUpdate: (task) => {
        if (task !== rootTask) return;
        const total = task.total;
        const ratio = total > 0 ? Math.min(1, Math.max(0, task.progress / total)) : 0;
        const percent = Math.round(ratio * 100);
        onProgress({
          phase: 'downloading',
          percent,
          label: total > 0 ? `Đang tải Java (${component})... (${task.progress}/${total})` : `Đang tải Java (${component})...`,
        });
      },
    });
  } catch (e) {
    if (e instanceof CancelledError) throw e;
    throw new Error(`Không thể tải Java (${component}): ${e.message}`);
  } finally {
    unregisterActiveTask(rootTask);
  }

  if (process.platform !== 'win32') {
    try { fs.chmodSync(javaExecutablePath(component), 0o755); } catch (e) { /* bỏ qua nếu không set được */ }
  }

  onProgress({ phase: 'downloading', percent: 100, label: `Đã tải xong Java (${component}).` });

  return javaExecutablePath(component);
}

module.exports = {
  ensureJavaRuntime,
  isJavaRuntimeInstalled,
  javaExecutablePath,
  javaRuntimeDir,
  guessJavaComponent,
  getInstalledJavaMajorVersion,
  parseJavaMajorVersion,
};
