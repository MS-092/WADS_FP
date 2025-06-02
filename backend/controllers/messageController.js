const Message = require("../models/Message");

// Send Message to a Ticket
exports.sendMessage = async (req, res) => {
  const { content } = req.body;
  const ticketId = req.params.ticketId;
  const sender = req.user.id;

  console.log(`New message for ticket ${ticketId} from user ${sender}`);

  try {
    const newMessage = new Message({ ticketId, sender, content });
    await newMessage.save();
    console.log("Message saved:", newMessage._id);
    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("💥 Send message error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get All Messages for a Ticket
exports.getTicketMessages = async (req, res) => {
  const ticketId = req.params.ticketId;

  console.log(`Fetching messages for ticket ${ticketId}`);

  try {
    const messages = await Message.find({ ticketId }).sort({ createdAt: 1 }).populate("sender", "name");
    console.log(`Found ${messages.length} message(s)`);
    res.json(messages);
  } catch (err) {
    console.error("💥 Get messages error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
