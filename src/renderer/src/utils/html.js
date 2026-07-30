// Chặn XSS khi nội dung không đáng tin (tên/mô tả đọc từ file mod, resource
// pack do người dùng tự thả vào — không phải do launcher kiểm soát) được
// chèn vào innerHTML. Dùng ở bất kỳ nơi nào render dữ liệu bên ngoài.
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default escapeHtml;
