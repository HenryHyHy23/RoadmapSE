function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Endpoint not found' });
}

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
