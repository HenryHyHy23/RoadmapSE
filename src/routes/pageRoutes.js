const express = require('express');

const router = express.Router();

const pages = [
  { path: '/', view: 'index', page: 'home' },
  { path: '/learn', view: 'learn', page: 'learn' },
  { path: '/challenge', view: 'challenge', page: 'challenge' },
  { path: '/checklist', view: 'checklist', page: 'checklist' },
  { path: '/contact', view: 'contact', page: 'contact' },
];

pages.forEach(({ path, view, page }) => {
  router.get(path, (req, res) => {
    res.render(view, { page });
  });
});

module.exports = router;
