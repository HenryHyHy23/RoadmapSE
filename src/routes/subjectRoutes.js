const express           = require('express');
const router            = express.Router();
const subjectController = require('../controllers/subjectController');

// GET /api/subjects              → danh sách tất cả môn (metadata)
router.get('/', subjectController.getAll);

// GET /api/subjects/:id          → chi tiết 1 môn (full content)
router.get('/:id', subjectController.getById);

// GET /api/subjects/:id/lessons  → chỉ cấu trúc bài học (sidebar)
router.get('/:id/lessons', subjectController.getLessonTree);

module.exports = router;