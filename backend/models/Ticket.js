const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  category: String,
  status: {
    type: String,
    default: "open"
  }
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
