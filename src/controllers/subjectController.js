const Subject = require("../models/Subject");

function stripLessonContent(lessons = []) {
  return lessons.map((lesson) => ({
    name: lesson.name,
    icon: lesson.icon,
    type: lesson.type,
    ...(lesson.subLessons
      ? { subLessons: stripLessonContent(lesson.subLessons) }
      : {}),
  }));
}

function stripSubjectContent(subject) {
  return {
    id: subject.id,
    code: subject.code,
    name: subject.name,
    desc: subject.desc,
    file: subject.file,
    note: subject.note,
    noteColor: subject.noteColor,
    noteIcon: subject.noteIcon,
    subLessons: stripLessonContent(subject.subLessons || []),
  };
}

const subjectController = {
  /**
   * GET /api/subjects
   * Trả về danh sách môn học với metadata nhẹ, chưa kèm HTML content.
   */
  getAll(req, res) {
    try {
      const subjects = Subject.getAll().map(stripSubjectContent);
      res.json({ success: true, total: subjects.length, data: subjects });
    } catch (err) {
      console.error("[subjectController.getAll]", err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/subjects/:id
   * Trả về đầy đủ 1 môn (kèm subLessons, content).
   */
  getById(req, res) {
    try {
      const subject = Subject.getById(req.params.id);
      if (!subject) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy môn học" });
      }
      res.json({ success: true, data: subject });
    } catch (err) {
      console.error("[subjectController.getById]", err.message);
      res
        .status(500)
        .json({ success: false, message: "Lỗi đọc dữ liệu môn học" });
    }
  },

  /**
   * GET /api/subjects/:id/lessons
   * Chỉ trả về cấu trúc bài học, không kèm HTML content.
   */
  getLessonTree(req, res) {
    try {
      const subject = Subject.getById(req.params.id);
      if (!subject) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy môn học" });
      }

      res.json({
        success: true,
        data: {
          id: subject.id,
          code: subject.code,
          name: subject.name,
          lessons: stripLessonContent(subject.subLessons || []),
        },
      });
    } catch (err) {
      console.error("[subjectController.getLessonTree]", err.message);
      res
        .status(500)
        .json({ success: false, message: "Lỗi đọc cấu trúc bài học" });
    }
  },
};

module.exports = subjectController;
