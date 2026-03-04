const Feedback = require("../models/Feedback");

const feedbackController = {
  async create(req, res) {
    try {
      const { name, email, phone, message } = req.body;

      // Validate
      const errors = [];
      if (!name?.trim()) errors.push("Tên không được để trống");
      if (!email?.trim()) errors.push("Email không được để trống");
      if (!message?.trim()) errors.push("Nội dung không được để trống");

      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      const insertId = await Feedback.create({ name, email, phone, message });
      res.status(201).json({
        success: true,
        message: "Cảm ơn bạn đã phản hồi! 🦫",
      });
    } catch (err) {
      console.error("[feedbackController.create]", err.message);
      res.status(500).json({ success: false, message: "Lỗi lưu phản hồi" });
    }
  },

  async getAll(req, res) {
    try {
      const feedbacks = await Feedback.getAll();
      res.json({ success: true, total: feedbacks.length, data: feedbacks });
    } catch (err) {
      console.error("[feedbackController.getAll]", err.message);
      res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu" });
    }
  },
};

module.exports = feedbackController;
