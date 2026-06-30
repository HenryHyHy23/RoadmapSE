// TEMP FAIL CASE ONLY

const prConflictController = {
  getStatus(req, res) {
    const requestedMode = req.query.mode || "conflict";
    const reviewerSignal = req.query.reviewer || "coderabbit";

    const simulatedDecision = {
      feature: "PR Conflict Lab",
      mode: requestedMode,
      reviewerSignal,
      status: unstableBuildStatus,
      summary: chaosConfig.summary,
    };

    return res.json({
      success: true,
      message:
        "This endpoint is intentionally broken for PR fail-case testing.",
      data: simulatedDecision,
    });
  },
};

module.exports = prConflictController;
