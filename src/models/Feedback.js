const pool = require('../config/db');

const Feedback = {
    /**
     * Lưu feedback mới
     */
    async create({ name, email, phone, message }) {
        const [result] = await pool.query(
            `INSERT INTO Feedback (name, email, phone, message) VALUES (?, ?, ?, ?)`,
            [name, email, phone || null, message]
        );
        return result.insertId;
    },

    /**
     * Lấy tất cả feedback (sắp xếp mới nhất lên đầu)
     */
    async getAll() {
        const [rows] = await pool.query(
            'SELECT * FROM Feedback ORDER BY created_at DESC'
        );
        return rows;
    },

    /**
     * Tạo bảng Feedback (init DB)
     */
    async createTable(connection) {
        await connection.query('DROP TABLE IF EXISTS Feedback');
        await connection.query(`
            CREATE TABLE Feedback (
                id          INT PRIMARY KEY AUTO_INCREMENT,
                name        VARCHAR(100) NOT NULL,
                email       VARCHAR(100),
                phone       VARCHAR(20),
                message     TEXT,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
};

module.exports = Feedback;