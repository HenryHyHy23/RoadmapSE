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
};

module.exports = feedbackController;
