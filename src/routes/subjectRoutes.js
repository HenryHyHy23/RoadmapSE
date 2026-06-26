const express = require('express');
const subjectController = require('../controllers/subjectController');

const router = express.Router();

router.get('/', subjectController.getAll);
router.get('/search', subjectController.search);
router.get('/:id', subjectController.getById);
router.get('/:id/lessons', subjectController.getLessonTree);

module.exports = router;
