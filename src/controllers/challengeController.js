const Challenge = require('../models/Challenge');

const challengeController = {
  getAll(req, res) {
    try {
      const challenges = Challenge.getAll();
      res.json(challenges);
    } catch (error) {
      console.error('[challengeController.getAll]', error.message);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = challengeController;
