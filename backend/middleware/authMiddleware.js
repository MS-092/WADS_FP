const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("⛔ No or malformed token");
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("✅ Authenticated user:", decoded);
    next();
  } catch (err) {
    console.log("❌ Invalid token:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

const authorize = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
};

module.exports = { authenticate: authMiddleware, authorize };

