const Subject = require('../models/Subject');

function buildLessonTree(lessons = []) {
  return lessons.map((lesson) => {
    const result = {
      name: lesson.name,
      icon: lesson.icon,
      type: lesson.type,
    };

    if (lesson.subLessons) {
      result.subLessons = buildLessonTree(lesson.subLessons);
    }

    return result;
  });
}

function buildSubjectSummary(subject) {
  return {
    id: subject.id,
    code: subject.code,
    name: subject.name,
    desc: subject.desc,
    file: subject.file,
    note: subject.note,
    noteColor: subject.noteColor,
    noteIcon: subject.noteIcon,
    subLessons: buildLessonTree(subject.subLessons || []),
  };
}

const subjectController = {
  getAll(req, res) {
    try {
      const subjects = Subject.getAll().map(buildSubjectSummary);

      return res.json({
        success: true,
        total: subjects.length,
        data: subjects,
      });
    } catch (error) {
      console.error('[subjectController.getAll]', error.message);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  getById(req, res) {
    try {
      const subject = Subject.getById(req.params.id);

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
      }

      return res.json({
        success: true,
        data: subject,
      });
    } catch (error) {
      console.error('[subjectController.getById]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to read subject data',
      });
    }
  },

  getLessonTree(req, res) {
    try {
      const subject = Subject.getById(req.params.id);

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
      }

      return res.json({
        success: true,
        data: {
          id: subject.id,
          code: subject.code,
          name: subject.name,
          lessons: buildLessonTree(subject.subLessons || []),
        },
      });
    } catch (error) {
      console.error('[subjectController.getLessonTree]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to read lesson tree',
      });
    }
  },
};

module.exports = subjectController;
