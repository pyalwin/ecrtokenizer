var express = require('express');
var router = express.Router();

require('dotenv').config()

/* GET default page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
