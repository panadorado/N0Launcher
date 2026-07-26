const fs = require('fs');
const path = require('path');
const { CancelledError } = require('@xmcl/task');

const undici = require('undici');
const { Agent } = undici;

const originalUndiciRequest = undici.request;
undici.request = function patchedUndiciRequest(url, opts, handler) {
  if (opts && typeof opts === 'object' && Object.prototype.hasOwnProperty.call(opts, 'throwOnError')) {
    const { throwOnError, ...cleanOpts } = opts;
    return originalUndiciRequest.call(this, url, cleanOpts, handler);
  }
  return originalUndiciRequest.call(this, url, opts, handler);
};

const {
  getVersionList,
  installTask,
  installDependenciesTask,
  installForgeTask,
  installNeoForgedTask,
  installFabric,
} = require('@xmcl/installer');
const { Version } = require('@xmcl/core');
const { getNetworkOptions, fetchVersionListWithFallback } = require('./network');

function isVersionInstalled(gameDir, versionId) {
  if (!versionId) return false;
  const dir = path.join(gameDir, 'versions', versionId);
  return fs.existsSync(path.join(dir, `${versionId}.json`)) && fs.existsSync(path.join(dir, `${versionId}.jar`));
}


let activeTask = null;
let cancelRequested = false;

function resetCancelState() {
  cancelRequested = false;
  activeTask = null;
}

function isCancelRequested() {
  return cancelRequested;
}

function cancelInstall() {
  cancelRequested = true;
  if (activeTask) {
    activeTask.cancel();
    return true;
  }
  return false;
}

function registerActiveTask(task) {
  activeTask = task;
}

function unregisterActiveTask(task) {
  if (activeTask === task) activeTask = null;
}

function runTrackedTask(rootTask, onProgress, { start, end, label }) {
  if (cancelRequested) {
    // Người dùng đã bấm "Dừng tải" trong lúc đang chuyển bước (giữa 2 lần
    // gọi runTrackedTask) — không bắt đầu tác vụ mới nữa.
    return Promise.reject(new CancelledError());
  }

  activeTask = rootTask;

  return rootTask.startAndWait({
    onUpdate: (task) => {
      if (task !== rootTask) return;
      const total = task.total;
      const ratio = total > 0 ? Math.min(1, Math.max(0, task.progress / total)) : 0;
      const percent = Math.round(start + ratio * (end - start));
      onProgress({
        phase: 'downloading',
        percent,
        label: total > 0 ? `${label}... (${task.progress}/${total})` : `${label}...`,
      });
    },
  }).finally(() => {
    if (activeTask === rootTask) activeTask = null;
  });
}

async function installProfile(profile, gameDir, onProgress = () => {}) {

  fs.mkdirSync(gameDir, { recursive: true });

  const isVanilla = profile.loader === 'vanilla';

  const existingVersionId = isVanilla ? profile.gameVersion : profile.installedVersionId;

  if (existingVersionId && isVersionInstalled(gameDir, existingVersionId)) {
    onProgress({ phase: 'installing', percent: 100, label: 'Đã cài đặt sẵn, bỏ qua bước cài lại.' });
    return existingVersionId;
  }

  resetCancelState();
  onProgress({ phase: 'installing', percent: 0, label: `Đang chuẩn bị cài đặt...` });

  const vanillaWeightEnd = isVanilla ? 40 : 20;
  const loaderWeightEnd = isVanilla ? vanillaWeightEnd : (profile.loader === 'fabric' ? vanillaWeightEnd + 10 : 70);

  let versionId;

  try {
    const netOptions = getNetworkOptions();
    const vanillaMeta = (await fetchVersionListWithFallback(getVersionList)).versions.find(v => v.id === profile.gameVersion);
    if (vanillaMeta) {
      await runTrackedTask(
        installTask(vanillaMeta, gameDir, netOptions),
        onProgress,
        { start: 0, end: vanillaWeightEnd, label: 'Đang tải Minecraft gốc' }
      );
    }

    if (isVanilla) {
      versionId = profile.gameVersion;
    } else if (profile.loader === 'forge') {
      versionId = await runTrackedTask(
        installForgeTask({ version: profile.loaderVersion, mcversion: profile.gameVersion }, gameDir, netOptions),
        onProgress,
        { start: vanillaWeightEnd, end: loaderWeightEnd, label: 'Đang tải Forge' }
      );
    } else if (profile.loader === 'neoforge') {
      versionId = await runTrackedTask(
        installNeoForgedTask('neoforge', profile.loaderVersion, gameDir, netOptions),
        onProgress,
        { start: vanillaWeightEnd, end: loaderWeightEnd, label: 'Đang tải NeoForge' }
      );
    } else if (profile.loader === 'fabric') {
      onProgress({ phase: 'downloading', percent: vanillaWeightEnd, label: 'Đang dựng cấu hình Fabric...' });
      versionId = await installFabric({ minecraftVersion: profile.gameVersion, version: profile.loaderVersion, minecraft: gameDir });
      onProgress({ phase: 'downloading', percent: loaderWeightEnd, label: 'Đã dựng xong cấu hình Fabric.' });
    } else {
      throw new Error(`Loader không được hỗ trợ: ${profile.loader}`);
    }

    const resolved = await Version.parse(gameDir, versionId);
    await runTrackedTask(
      installDependenciesTask(resolved, netOptions),
      onProgress,
      { start: loaderWeightEnd, end: 100, label: 'Đang tải thư viện phụ thuộc' }
    );
  } catch (e) {
    if (e instanceof CancelledError) {
      onProgress({ phase: 'cancelled', percent: 0, label: 'Đã dừng tải theo yêu cầu.' });
      throw new Error('Đã dừng tải theo yêu cầu.');
    }
    throw e;
  }

  onProgress({ phase: 'installing', percent: 100, label: 'Đã cài đặt xong!' });

  return versionId;
}

module.exports = { installProfile, cancelInstall, isCancelRequested, resetCancelState, registerActiveTask, unregisterActiveTask };
