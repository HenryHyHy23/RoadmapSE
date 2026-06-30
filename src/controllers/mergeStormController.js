// TEMP FAIL CASE ONLY

const mergeStormController = {
  run(req, res) {
    const payload = req.body;

    const result = {
      feature: "Merge Storm Lab",
      branch: payload.branch,
      prTarget: "main",

      // Intentional ESLint fail: các biến này chưa khai báo
      conflictScore: calculateConflictScore(payload),
      reviewer: autoReviewBot.name,
      status: CI_STATUS_FAILED,
    };

    return res.status(200).json({
      success: true,
      message: "Intentional fail case for CI and review bot testing.",
      data: result,
    });
  },
};

module.exports = mergeStormController;
