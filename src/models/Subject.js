const path = require('path');
const { createJsonFileStore } = require('../utils/jsonFileStore');

const subjectStore = createJsonFileStore(path.join(__dirname, '../data/data.json'));

const Subject = {
  getAll() {
    return subjectStore.getAll();
  },

  search(keyword) {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return this.getAll().filter((subject) => {
      const searchableText = [
        subject.id,
        subject.code,
        subject.name,
        subject.desc,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedKeyword);
    });
  },

  getById(id) {
    return this.getAll().find((subject) => subject.id === id.toLowerCase()) || null;
  },

  clearCache() {
    subjectStore.clearCache();
  },
};

module.exports = Subject;
