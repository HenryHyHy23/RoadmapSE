const express = require('express');
const cors = require('cors');
const path = require('path');

const pageRoutes = require('./routes/pageRoutes');
const quizRoutes = require('./routes/quizRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const systemRoutes = require('./routes/systemRoutes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandlers');

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.locals.apiBaseUrl = process.env.PUBLIC_API_BASE_URL || '';
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use('/', pageRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/', systemRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
