const express = require('express');
const {
  createTicket,
  getUserTickets,
  getAllTickets,
  updateTicketStatus
} = require('../controllers/ticketController');

const { authenticate } = require('../middleware/authMiddleware'); // FIXED: Destructure the import

const router = express.Router();

router.post('/create', authenticate, (req, res, next) => {
  console.log("Creating a new ticket");
  next();
}, createTicket);

router.get('/my', authenticate, (req, res, next) => {
  console.log(`Fetching tickets for user: ${req.user.id}`);
  next();
}, getUserTickets);

// Remove authorize('admin') unless you have implemented it
router.get('/all', authenticate, (req, res, next) => {
  console.log("Admin fetching all tickets");
  next();
}, getAllTickets);

router.put('/update/:id', authenticate, (req, res, next) => {
  console.log(`Updating status of ticket ${req.params.id}`);
  next();
}, updateTicketStatus);

module.exports = router;
