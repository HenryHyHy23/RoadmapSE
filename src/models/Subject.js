const path = require('path');
const { createJsonFileStore } = require('../utils/jsonFileStore');

const subjectStore = createJsonFileStore(path.join(__dirname, '../data/data.json'));

const Subject = {
  getAll() {
    return subjectStore.getAll();
  },

  getById(id) {
    return this.getAll().find((subject) => subject.id === id.toLowerCase()) || null;
  },

  clearCache() {
    subjectStore.clearCache();
  },
};

module.exports = Subject;
