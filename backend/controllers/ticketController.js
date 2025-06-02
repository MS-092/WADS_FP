const Ticket = require("../models/Ticket");
const User = require('../models/User');

// 1. Create Ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, category } = req.body;
    const newTicket = new Ticket({
      subject,
      category,
      status: 'open',
      user: req.user.id,
    });
    await newTicket.save();
    console.log("✅ Ticket created by user:", req.user.id);
    res.status(201).json({ message: 'Ticket created successfully' });
  } catch (err) {
    console.error("💥 Ticket creation failed:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2. Get Current User's Tickets
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error("💥 Failed to fetch user tickets:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. Get All Tickets (Admin)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('user', 'name').sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error("💥 Failed to fetch all tickets:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. Update Ticket Status
exports.updateTicketStatus = async (req, res) => {
  const ticketId = req.params.id;
  const { status } = req.body;

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    console.log("✅ Ticket status updated:", ticketId);
    res.json({ message: 'Ticket status updated' });
  } catch (err) {
    console.error("💥 Failed to update status:", err);
    res.status(500).json({ error: 'Server error' });
  }
};