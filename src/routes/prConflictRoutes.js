// TEMP FAIL CASE ONLY

const express = require("express");
const prConflictController = require("../controllers/prConflictController");

const router = express.Router();

router.get("/status", prConflictController.getStatus);

// Intentional review issue: simulate không tồn tại trong controller
router.post("/simulate", prConflictController.simulate);

module.exports = router;
