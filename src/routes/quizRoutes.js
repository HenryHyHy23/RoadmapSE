const express        = require('express');
const router         = express.Router();
const quizController = require('../controllers/quizController');

// GET /api/quiz/stats        → thống kê số câu mỗi môn
router.get('/stats', quizController.getStats);

// GET /api/quiz/:category    → lấy 20 câu ngẫu nhiên
router.get('/:category', quizController.getByCategory);

module.exports = router;