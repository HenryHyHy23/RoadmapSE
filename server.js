require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

module.exports = app;

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});
