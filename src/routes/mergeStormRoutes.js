// TEMP FAIL CASE ONLY

const express = require("express");
const mergeStormController = require("../controllers/mergeStormController");

const router = express.Router();

router.post("/run", mergeStormController.run);

// Intentional review issue: hàm rollback không tồn tại
router.post("/rollback", mergeStormController.rollback);

module.exports = router;
