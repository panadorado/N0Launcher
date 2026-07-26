// Đề xuất RAM tối đa (MB) dựa theo phiên bản Minecraft + loại loader của
// cấu hình đang chọn. Đây là ước lượng hợp lý dựa theo độ nặng chung của
// từng dải phiên bản (không gọi mạng, không đo phần cứng máy), tương tự
// cách nhiều launcher phổ biến khác gợi ý RAM mặc định.
export function recommendRamMB(profile) {
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

  return Math.min(base, 16384);
}

export default recommendRamMB;