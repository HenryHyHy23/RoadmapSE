const pool = require('../config/db');
const { QUIZ_QUESTION_LIMIT } = require('../constants/quiz');

const Question = {
  async getByCategory(category) {
    const [rows] = await pool.query(
      `SELECT id, category, question_text, option_a, option_b,
              option_c, option_d, correct_answer, explanation
       FROM Questions
       WHERE category = ?
       ORDER BY RAND()
       LIMIT ?`,
      [category, QUIZ_QUESTION_LIMIT],
    );

    return rows;
  },

  async getAll() {
    const [rows] = await pool.query('SELECT * FROM Questions ORDER BY category, id');
    return rows;
  },

  async countByCategory() {
    const [rows] = await pool.query(
      `SELECT category, COUNT(*) AS total
       FROM Questions
       GROUP BY category
       ORDER BY category`,
    );

    return rows;
  },

  async createTable(connection) {
    await connection.query('DROP TABLE IF EXISTS Questions');
    await connection.query(`
      CREATE TABLE Questions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category VARCHAR(10) NOT NULL,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255),
        option_b VARCHAR(255),
        option_c VARCHAR(255),
        option_d VARCHAR(255),
        correct_answer CHAR(1),
        explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  },

  async bulkInsert(connection, values) {
    const sql = `
      INSERT INTO Questions
        (category, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ?
    `;

    await connection.query(sql, [values]);
  },
};

module.exports = Question;
