const pool = require('../config/db');

const Question = {
    /**
     * @param {string} category - JPD | DBI | MAS | LAB | SWEc
     */
    async getByCategory(category) {
        const [rows] = await pool.query(
            `SELECT id, category, question_text, option_a, option_b, 
                    option_c, option_d, correct_answer, explanation
             FROM Questions 
             WHERE category = ? 
             ORDER BY RAND() 
             LIMIT 30`,
            [category]
        );
        return rows;
    },

    /**
     * Lấy tất cả câu hỏi (dùng cho init/seed)
     */
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM Questions ORDER BY category, id');
        return rows;
    },

    /**
     * Đếm số câu theo từng category
     */
    async countByCategory() {
        const [rows] = await pool.query(
            `SELECT category, COUNT(*) as total 
             FROM Questions 
             GROUP BY category 
             ORDER BY category`
        );
        return rows;
    },

    /**
     * Tạo bảng Questions (init DB)
     */
    async createTable(connection) {
        await connection.query('DROP TABLE IF EXISTS Questions');
        await connection.query(`
            CREATE TABLE Questions (
                id              INT PRIMARY KEY AUTO_INCREMENT,
                category        VARCHAR(10)  NOT NULL,
                question_text   TEXT         NOT NULL,
                option_a        VARCHAR(255),
                option_b        VARCHAR(255),
                option_c        VARCHAR(255),
                option_d        VARCHAR(255),
                correct_answer  CHAR(1),
                explanation     TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    },

    /**
     * Bulk insert câu hỏi
     */
    async bulkInsert(connection, values) {
        const sql = `
            INSERT INTO Questions 
                (category, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) 
            VALUES ?
        `;
        await connection.query(sql, [values]);
    }
};

module.exports = Question;
