const express            = require('express');
const router             = express.Router();
const feedbackController = require('../controllers/feedbackController');

// POST /api/feedback    → gửi feedback mới
router.post('/', feedbackController.create);

// GET  /api/feedback    → xem tất cả feedback (admin)
router.get('/', feedbackController.getAll);

module.exports = router;