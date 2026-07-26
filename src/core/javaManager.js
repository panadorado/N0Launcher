const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { CancelledError } = require('@xmcl/task');
const { fetchJavaRuntimeManifest, installJavaRuntimeTask } = require('@xmcl/installer');
const { isCancelRequested, registerActiveTask, unregisterActiveTask } = require('./installer');
const { getNetworkOptions } = require('./network');

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

async function ensureJavaRuntime(component, onProgress = () => {}) {
  if (isJavaRuntimeInstalled(component)) {
    return javaExecutablePath(component);
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
};
