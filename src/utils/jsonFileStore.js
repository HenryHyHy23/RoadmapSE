const fs = require('fs');

function createJsonFileStore(filePath) {
  let cache = null;

  return {
    getAll() {
      if (!cache) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        cache = JSON.parse(fileContent);
      }

      return cache;
    },

    clearCache() {
      cache = null;
    },
  };
}

module.exports = { createJsonFileStore };
