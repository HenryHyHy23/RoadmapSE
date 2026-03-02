const Subject = require('../models/Subject');

const subjectController = {
    /**
     * GET /api/subjects
     * Trả về toàn bộ danh sách môn học (metadata, không có content)
     */
    getAll(req, res) {
    try {
        //  Trả về toàn bộ data kèm subLessons
        const subjects = Subject.getAll();
        res.json({ success: true, total: subjects.length, data: subjects });
    } catch (err) {
        console.error('[subjectController.getAll]', err.message);
        res.status(500).json({ success: false, message: err.message }); // ← log ra lỗi thật
    }
},

    /**
     * GET /api/subjects/:id
     * Trả về đầy đủ 1 môn (kèm subLessons, content)
     */
    getById(req, res) {
        try {
            const subject = Subject.getById(req.params.id);
            if (!subject) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });
            }
            res.json({ success: true, data: subject });
        } catch (err) {
            console.error('[subjectController.getById]', err.message);
            res.status(500).json({ success: false, message: 'Lỗi đọc dữ liệu môn học' });
        }
    },

    /**
     * GET /api/subjects/:id/lessons
     * Chỉ trả về cấu trúc bài học (không có HTML content) - dùng để render sidebar
     */
    getLessonTree(req, res) {
        try {
            const subject = Subject.getById(req.params.id);
            if (!subject) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });
            }

            // Strip content để response nhẹ hơn
            const stripContent = (lessons) => lessons.map(l => ({
                name: l.name,
                icon: l.icon,
                type: l.type,
                ...(l.subLessons ? { subLessons: stripContent(l.subLessons) } : {})
            }));

            res.json({
                success: true,
                data: {
                    id: subject.id,
                    code: subject.code,
                    name: subject.name,
                    lessons: stripContent(subject.subLessons || [])
                }
            });
        } catch (err) {
            console.error('[subjectController.getLessonTree]', err.message);
            res.status(500).json({ success: false, message: 'Lỗi đọc cấu trúc bài học' });
        }
    }
};

module.exports = subjectController;