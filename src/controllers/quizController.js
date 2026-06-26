const Question = require('../models/Question');
const Feedback = require('../models/Feedback');
const pool = require('../config/db');
const seedData = require('../data/seeds');
const { VALID_QUIZ_CATEGORIES } = require('../constants/quiz');

const quizController = {
  async getByCategory(req, res) {
    try {
      const { category } = req.params;

      if (!VALID_QUIZ_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Category is invalid. Allowed values: ${VALID_QUIZ_CATEGORIES.join(', ')}`,
        });
      }

      const questions = await Question.getByCategory(category);

      if (questions.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No questions found for category ${category}`,
        });
      }

      return res.json({
        success: true,
        total: questions.length,
        data: questions,
      });
    } catch (error) {
      console.error('[quizController.getByCategory]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to load quiz questions',
      });
    }
  },

  async getStats(req, res) {
    try {
      const stats = await Question.countByCategory();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[quizController.getStats]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to load quiz statistics',
      });
    }
  },

  async initDatabase(req, res) {
    const connection = await pool.getConnection();

    try {
      await Question.createTable(connection);
      await Feedback.createTable(connection);
      await Question.bulkInsert(connection, seedData);

      return res.json({
        success: true,
        message: `Loaded ${seedData.length} questions into the database`,
      });
    } catch (error) {
      console.error('[quizController.initDatabase]', error.message);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    } finally {
      connection.release();
    }
  },
};

module.exports = quizController;
