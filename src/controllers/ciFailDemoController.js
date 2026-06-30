function ciFailDemo(req, res) {
  const message = "This file is intentionally broken for CI demo";

  const result = ; // intentional syntax error

  res.json({
    success: true,
    message,
    result,
  });
}

module.exports = { ciFailDemo };