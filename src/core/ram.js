const os = require('os')

function recommendRamMB(profile) {
  if (!profile || !profile.gameVersion) return 2048;

  const parts = String(profile.gameVersion).split('.').map(n => parseInt(n, 10) || 0);
  const minor = parts[1] || 0;
  const patch = parts[2] || 0;

  let base;
  if (minor > 20 || (minor === 20 && patch >= 5)) base = 4096; // 1.20.5+
  else if (minor >= 18) base = 3584;                            // 1.18 - 1.20.4
  else if (minor >= 13) base = 2560;                            // 1.13 - 1.17.x
  else base = 2048;                                             // <= 1.12.x

  // Modpack/mod loader thường cần thêm RAM để chạy song song các mod.
  if (profile.loader && profile.loader !== 'vanilla') base += 2048;

  // tính toán ram đang có
  const maxRam = Math.floor(os.totalmem / (1024 * 1024));

  return Math.min(base, maxRam);
}

module.exports = { recommendRamMB };
