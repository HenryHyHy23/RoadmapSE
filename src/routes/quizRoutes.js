const express = require('express');
const quizController = require('../controllers/quizController');

const router = express.Router();

router.get('/stats', quizController.getStats);
router.get('/:category', quizController.getByCategory);

module.exports = router;
