const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loginWithMicrosoft: () => ipcRenderer.invoke('auth:loginWithMicrosoft'),
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
});