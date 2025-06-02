const express = require('express');
const { sendMessage, getTicketMessages } = require('../controllers/messageController');
const { authenticate } = require('../middleware/authMiddleware'); // <-- FIXED LINE
const router = express.Router();

router.post('/:ticketId', authenticate, (req, res, next) => {
  console.log(`Sending message to ticket ${req.params.ticketId}`);
  next();
}, sendMessage);

router.get('/:ticketId', authenticate, (req, res, next) => {
  console.log(`Getting messages for ticket ${req.params.ticketId}`);
  next();
}, getTicketMessages);

module.exports = router;