const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();

router.post('/register', (req, res, next) => {
  console.log("Register endpoint hit");
  next();
}, register);

router.post('/login', (req, res, next) => {
  console.log("Login endpoint hit");
  next();
}, login);


module.exports = router;
