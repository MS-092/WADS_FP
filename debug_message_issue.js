// Debug script to test message display issue
// This simulates the exact scenario described by the user

function formatMessageAuthor(message, user) {
  console.log('formatMessageAuthor called with:', {
    messageId: message._id || message.id,
    messageSender: message.sender,
    currentUser: user,
    senderRole: message.sender?.role
  });
  
  // Check if message is from current user for styling purposes
  const isCurrentUser = message.sender?.id === user?.id || message.sender?._id === user?.id || String(message.sender?.id) === String(user?.id)
  
  console.log('ID comparison result:', {
    'sender.id': message.sender?.id,
    'sender._id': message.sender?._id,
    'user.id': user?.id,
    'user._id': user?._id,
    isCurrentUser
  });
  
  // Use "You" for current user's messages, otherwise use the actual sender's name
  const senderName = isCurrentUser ? "You" : (message.sender?.full_name || message.sender?.username || "Unknown User")
  const senderRole = message.sender?.role || "user"
  
  console.log('Final result:', {
    senderName,
    senderRole,
    isCurrentUser
  });
  
  // Format role display
  let roleDisplay = "Customer"
  if (senderRole === "admin") {
    roleDisplay = "Admin"
  } else if (senderRole === "agent") {
    roleDisplay = "Agent"
  } else if (senderRole === "customer") {
    roleDisplay = "Customer"
  }
  
  return {
    name: senderName,
    role: roleDisplay,
    isCustomer: isCurrentUser && user?.role === "customer"
  }
}

// Test data based on the user's issue description
const testCustomerUser = {
  id: "customer123",
  _id: "customer123",
  username: "testcustomer",
  full_name: "Test Customer",
  role: "customer"
};

const testAdminUser = {
  id: "admin456",
  _id: "admin456", 
  username: "testadmin",
  full_name: "Test Admin",
  role: "admin"
};

// Messages from the conversation - simulating the exact issue
const testMessages = [
  {
    id: "msg1",
    _id: "msg1",
    content: "hello",
    sender: {
      id: "customer123",
      _id: "customer123",
      username: "testcustomer", 
      full_name: "Test Customer",
      role: "customer"
    },
    created_at: new Date("6/2/2025, 7:44:17 PM")
  },
  {
    id: "msg2", 
    _id: "msg2",
    content: "hello",
    sender: {
      id: "customer123",
      _id: "customer123",
      username: "testcustomer",
      full_name: "Test Customer", 
      role: "customer"
    },
    created_at: new Date("6/2/2025, 7:46:39 PM")
  },
  {
    id: "msg3",
    _id: "msg3", 
    content: "hello",
    sender: {
      id: "admin456",
      _id: "admin456",
      username: "testadmin",
      full_name: "Test Admin",
      role: "admin"
    },
    created_at: new Date("6/2/2025, 7:48:26 PM")
  },
  {
    id: "msg4",
    _id: "msg4",
    content: "hello from admin", 
    sender: {
      id: "admin456",
      _id: "admin456",
      username: "testadmin",
      full_name: "Test Admin",
      role: "admin"
    },
    created_at: new Date("6/2/2025, 7:49:21 PM")
  }
];

console.log("=== Testing Message Display Issue ===");
console.log("Customer viewing the conversation:");
console.log("");

testMessages.forEach((message, index) => {
  console.log(`Message ${index + 1}:`);
  const result = formatMessageAuthor(message, testCustomerUser);
  console.log(`  Expected: ${message.sender.role === 'customer' ? 'You' : message.sender.full_name}`);
  console.log(`  Actual: ${result.name}`);
  console.log(`  Role: ${result.role}`);
  console.log(`  Issue: ${result.name === 'You' && message.sender.role !== 'customer' ? 'BUG! Admin message shows as You' : 'OK'}`);
  console.log("");
});

// Test potential issue scenarios
console.log("=== Testing Potential Issues ===");

// Scenario 1: User ID mismatch types
const userWithStringId = { ...testCustomerUser, id: "customer123", _id: undefined };
const userWithObjectId = { ...testCustomerUser, id: undefined, _id: "customer123" };

console.log("Test 1: String ID vs ObjectId mismatch");
const adminMessage = testMessages[2];
console.log("Admin message with string user ID:", formatMessageAuthor(adminMessage, userWithStringId).name);
console.log("Admin message with ObjectId user ID:", formatMessageAuthor(adminMessage, userWithObjectId).name);

// Scenario 2: Empty/undefined user data  
console.log("\nTest 2: Empty user data");
console.log("Admin message with null user:", formatMessageAuthor(adminMessage, null).name);
console.log("Admin message with undefined user:", formatMessageAuthor(adminMessage, undefined).name);

// Scenario 3: Message sender data issues
console.log("\nTest 3: Message sender data issues");
const messageWithoutSender = { ...adminMessage, sender: null };
const messageWithEmptySender = { ...adminMessage, sender: {} };
console.log("Message without sender:", formatMessageAuthor(messageWithoutSender, testCustomerUser).name);
console.log("Message with empty sender:", formatMessageAuthor(messageWithEmptySender, testCustomerUser).name); 