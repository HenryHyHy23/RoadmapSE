const Question = require('../models/Question');
const pool     = require('../config/db');

// Seed data - toàn bộ câu hỏi
const SEED_DATA = require('../data/seeds');

const quizController = {
    /**
     * GET /api/quiz/:category
     * Trả về 20 câu ngẫu nhiên theo môn
     */
    async getByCategory(req, res) {
        try {
            const { category } = req.params;
            const VALID_CATEGORIES = ['JPD', 'DBI', 'MAS', 'LAB', 'SWEc'];

            if (!VALID_CATEGORIES.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: `Category không hợp lệ. Chỉ chấp nhận: ${VALID_CATEGORIES.join(', ')}`
                });
            }

            const questions = await Question.getByCategory(category);

            if (questions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy câu hỏi cho môn ${category}`
                });
            }

            res.json({ success: true, total: questions.length, data: questions });

        } catch (err) {
            console.error('[quizController.getByCategory]', err.message);
            res.status(500).json({ success: false, message: 'Lỗi lấy câu hỏi' });
        }
    },

    /**
     * GET /api/quiz/stats
     * Thống kê số câu theo từng môn
     */
    async getStats(req, res) {
        try {
            const stats = await Question.countByCategory();
            res.json({ success: true, data: stats });
        } catch (err) {
            console.error('[quizController.getStats]', err.message);
            res.status(500).json({ success: false, message: 'Lỗi lấy thống kê' });
        }
    },

    /**
     * GET /init-db
     * Khởi tạo & seed database (chỉ dùng 1 lần)
     */
    async initDatabase(req, res) {
        const connection = await pool.getConnection();
        try {
            await Question.createTable(connection);
            const Feedback = require('../models/Feedback');
            await Feedback.createTable(connection);
            await Question.bulkInsert(connection, SEED_DATA);

            const count = SEED_DATA.length;
            connection.release();

            console.log(`✅ Init DB xong: ${count} câu hỏi đã được nạp`);
            res.json({
                success: true,
                message: `Nạp thành công ${count} câu hỏi lên Aiven!`
            });
        } catch (err) {
            connection.release();
            console.error('[quizController.initDatabase]', err.message);
            res.status(500).json({ success: false, message: err.message });
        }
    }
};

module.exports = quizController;