const express = require('express');
const challengeController = require('../controllers/challengeController');

const router = express.Router();

router.get('/', challengeController.getAll);

module.exports = router;
