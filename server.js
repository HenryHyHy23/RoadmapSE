require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');

let challengeCache = null;

// ── Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    res.locals.apiBaseUrl = process.env.PUBLIC_API_BASE_URL || '';
    next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ── View Engine (EJS) 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Page Routes (EJS) 
const PAGES = [
    { path: '/',          view: 'index',     page: 'home' },
    { path: '/learn',     view: 'learn',     page: 'learn' },
    { path: '/challenge', view: 'challenge', page: 'challenge' },
    { path: '/checklist', view: 'checklist', page: 'checklist' },
    { path: '/contact',   view: 'contact',   page: 'contact' },
];
PAGES.forEach(({ path: p, view, page }) => {
    app.get(p, (req, res) => res.render(view, { page }));
});

// ── API Routes 
const quizRoutes     = require('./src/routes/quizRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const subjectRoutes  = require('./src/routes/subjectRoutes');
const quizController = require('./src/controllers/quizController');

app.use('/api/quiz',      quizRoutes);
app.use('/api/feedback',  feedbackRoutes);
app.use('/api/subjects',  subjectRoutes);
app.get('/api/challenges', (req, res) => {
    try {
        if (!challengeCache) {
            challengeCache = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'src/data/challenge-data.json'), 'utf-8')
            );
        }
        res.json(challengeCache);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Giữ backward-compat với route cũ
app.post('/feedback', (req, res) => res.redirect(307, '/api/feedback'));
app.get('/init-db',   quizController.initDatabase);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', env: process.env.NODE_ENV || 'development' }));

// Root info
app.get('/api', (req, res) => {
    res.json({
        message: '🦫 CapMotSach API is running!',
        version: '2.0.0',
        endpoints: {
            subjects:    'GET  /api/subjects',
            subject:     'GET  /api/subjects/:id',
            lessons:     'GET  /api/subjects/:id/lessons',
            quizStats:   'GET  /api/quiz/stats',
            quiz:        'GET  /api/quiz/:category  (JPD | DBI | MAS | LAB | SWEc)',
            feedback:    'POST /api/feedback',
            initDB:      'GET  /init-db'
        }
    });
});

// ── Error Handlers ─────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Start ──────────────────────────────────────────────────────────────────
module.exports = app;

app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`API docs: http://localhost:${PORT}/api`)
});
