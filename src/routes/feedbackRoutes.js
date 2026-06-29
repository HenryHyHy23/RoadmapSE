const express = require('express');
const feedbackController = require('../controllers/feedbackController');

const router = express.Router();

router.post('/', feedbackController.create);
router.get('/', feedbackController.getAll);
router.get('/report', feedbackController.getReport);

module.exports = router;
