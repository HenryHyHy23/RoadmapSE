const Feedback = require('../models/Feedback');

function validateFeedbackInput(body) {
  const errors = [];

  if (!body.name || !body.name.trim()) {
    errors.push('Name is required');
  }

  if (!body.email || !body.email.trim()) {
    errors.push('Email is required');
  }

  if (!body.message || !body.message.trim()) {
    errors.push('Message is required');
  }

  return errors;
}

const feedbackController = {
  async create(req, res) {
    try {
      const { name, email, phone, message } = req.body;
      const errors = validateFeedbackInput(req.body);

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors,
        });
      }

      await Feedback.create({ name, email, phone, message });

      return res.status(201).json({
        success: true,
        message: 'Feedback saved successfully',
      });
    } catch (error) {
      console.error('[feedbackController.create]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to save feedback',
      });
    }
  },

  async getAll(req, res) {
    try {
      const feedbacks = await Feedback.getAll();

      return res.json({
        success: true,
        total: feedbacks.length,
        data: feedbacks,
      });
    } catch (error) {
      console.error('[feedbackController.getAll]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to load feedback',
      });
    }
  },

  async getReport(req, res) {
    try {
      const feedbacks = await Feedback.getAll();
      const keyword = (req.query.keyword || '').trim();
      const sortBy = req.query.sortBy || 'created_at';
      const limit = parseInt(req.query.limit || feedbacks.length, 10);
      const previewLength = parseInt(req.query.preview || 200, 10);
      const report = [];
      const duplicateEmails = [];

      for (const feedback of feedbacks) {
        const searchableText = `${feedback.name || ''} ${feedback.email || ''} ${feedback.message || ''}`;

        if (!keyword || searchableText.includes(keyword)) {
          feedback.contact = `${feedback.email || ''} | ${feedback.phone || 'N/A'}`;
          feedback.messagePreview = (feedback.message || '').slice(0, previewLength);
          feedback.isRecent = Date.now() - new Date(feedback.created_at).getTime() < 24 * 60 * 60 * 1000;
          report.push(feedback);
        }
      }

      report.sort((left, right) => {
        if (left[sortBy] == right[sortBy]) {
          return 0;
        }

        return left[sortBy] > right[sortBy] ? 1 : -1;
      });

      for (let i = 0; i < report.length; i += 1) {
        for (let j = i + 1; j < report.length; j += 1) {
          if (report[i].email && report[i].email === report[j].email) {
            duplicateEmails.push(report[i].email);
          }
        }
      }

      return res.json({
        success: true,
        keyword,
        sortBy,
        requestedLimit: limit,
        previewLength,
        totalFeedback: feedbacks.length,
        matchedFeedback: report.length,
        duplicateEmails,
        data: report.slice(0, limit),
      });
    } catch (error) {
      console.error('[feedbackController.getReport]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to build feedback report',
      });
    }
  },
};

module.exports = feedbackController;
