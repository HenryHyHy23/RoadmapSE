const path = require("path");
const fs = require("fs");
let _cache = null;

const Subject = {
  /**
   * Trả về toàn bộ danh sách môn học từ data.json
   */
  getAll() {
    if (!_cache) {
      const filePath = path.join(__dirname, "../data/data.json");
      const raw = fs.readFileSync(filePath, "utf-8");
      _cache = JSON.parse(raw);
    }
    return _cache;
  },

  /**
   * Tìm 1 môn theo id (vd: "jpd", "dbi", ...)
   */
  getById(id) {
    return this.getAll().find((s) => s.id === id.toLowerCase()) || null;
  },

  /**
   * Reload cache (dùng khi cập nhật data.json lúc dev)
   */
  clearCache() {
    _cache = null;
  },
};

module.exports = Subject;
