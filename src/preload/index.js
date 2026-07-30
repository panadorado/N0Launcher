const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loginWithMicrosoftAccount: () => ipcRenderer.invoke('auth:loginWithMicrosoftAccount'),
  loginWithMicrosoftAuthentication: () => ipcRenderer.invoke('auth:loginWithMicrosoftAuthentication'),
  logoutMicrosoft: () => ipcRenderer.invoke('auth:logoutMicrosoft'),
  // Đăng ký lắng nghe mã đăng nhập Microsoft (device code) gửi từ main
  // process ngay khi có, trước khi loginWithMicrosoftAuthentication() resolve xong.
  onMicrosoftDeviceCode: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('auth:deviceCode', listener);
    return () => ipcRenderer.removeListener('auth:deviceCode', listener);
  },
  // Mở URL đăng nhập Microsoft trên trình duyệt hệ thống — thực hiện ở main
  // process (qua IPC) vì preload chạy sandbox không có sẵn module `shell`
  // (gọi shell.openExternal thẳng ở đây sẽ ném "Cannot read properties of
  // undefined (reading 'openExternal')"). Việc kiểm tra URL có đúng domain
  // microsoft.com hay không cũng được main process tự làm lại cho chắc.
  openMicrosoftLoginPage: (url) => ipcRenderer.invoke('auth:openMicrosoftLoginPage', url),
  loginOffline: (username) => ipcRenderer.invoke('auth:loginOffline', username),
  loginWithElyBy: (login, password) => ipcRenderer.invoke('auth:loginWithElyBy', login, password),
  launchGame: (account, profileId) => ipcRenderer.invoke('launcher:launchGame', account, profileId),
  cancelInstall: () => ipcRenderer.invoke('launcher:cancelInstall'),
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),

  getVersionList: () => ipcRenderer.invoke('versions:list'),
  addVersion: (version) => ipcRenderer.invoke('versions:add', version),
  
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

  // ---- Kiểm tra Java ----
  checkJava: (profileId) => ipcRenderer.invoke('system:checkJava', profileId),

  // ---- Mạng & Mirror tải xuống ----
  checkMirrors: () => ipcRenderer.invoke('network:checkMirrors'),

  // ---- Mods & Resource Packs ----
  listMods: (profileId) => ipcRenderer.invoke('mods:list', profileId),
  setModEnabled: (profileId, file, enabled) => ipcRenderer.invoke('mods:setEnabled', profileId, file, enabled),
  deleteMod: (profileId, file) => ipcRenderer.invoke('mods:delete', profileId, file),
  listResourcePacks: (profileId) => ipcRenderer.invoke('resourcepacks:list', profileId),
  openModsFolder: (profileId) => ipcRenderer.invoke('mods:openFolder', profileId),

  // ---- Cấu hình (Profiles) ----
  listProfiles: () => ipcRenderer.invoke('profiles:list'),
  createProfile: (profileInput) => ipcRenderer.invoke('profiles:create', profileInput),
  deleteProfile: (profileId) => ipcRenderer.invoke('profiles:delete', profileId),
  openProfileFolder: (profileId) => ipcRenderer.invoke('profiles:openFolder', profileId),

  // ---- Danh sách phiên bản theo loader ----
  getGameVersions: () => ipcRenderer.invoke('modloaders:getGameVersions'),
  getLoaderVersions: (loader, mcVersion) => ipcRenderer.invoke('modloaders:getLoaderVersions', loader, mcVersion),

  // Đăng ký lắng nghe tiến trình tải/giải nén/khởi chạy game.
  // Trả về hàm huỷ đăng ký để tránh rò rỉ listener nếu cần gọi lại.
  onLauncherProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('launcher:progress', listener);
    return () => ipcRenderer.removeListener('launcher:progress', listener);
  },

  // ---- Kiểm tra & tải bản cập nhật ----
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  isPortableBuild: () => ipcRenderer.invoke('update:isPortable'),
  getAppVersion: () => ipcRenderer.invoke('update:getVersion'),
  onUpdateStatus: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('update:status', listener);
    return () => ipcRenderer.removeListener('update:status', listener);
  },
});