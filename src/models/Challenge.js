const path = require('path');
const { createJsonFileStore } = require('../utils/jsonFileStore');

const challengeFilePath = path.join(__dirname, '../data/challenge-data.json');

module.exports = createJsonFileStore(challengeFilePath);
