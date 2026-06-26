const express = require('express');
const quizController = require('../controllers/quizController');

const router = express.Router();

router.post('/feedback', (req, res) => {
  res.redirect(307, '/api/feedback');
});

router.get('/init-db', quizController.initDatabase);

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    env: process.env.NODE_ENV || 'development',
  });
});

router.get('/api', (req, res) => {
  res.json({
    message: 'CapMotSach API is running!',
    version: '2.0.0',
    endpoints: {
      subjects: 'GET  /api/subjects',
      subjectSearch: 'GET  /api/subjects/search?q=keyword',
      subject: 'GET  /api/subjects/:id',
      lessons: 'GET  /api/subjects/:id/lessons',
      quizStats: 'GET  /api/quiz/stats',
      quiz: 'GET  /api/quiz/:category  (JPD | DBI | MAS | LAB | SWEc)',
      challenges: 'GET  /api/challenges',
      feedback: 'POST /api/feedback',
      initDB: 'GET  /init-db',
    },
  });
});

module.exports = router;
