const mongoose = require("mongoose");

const uri = "mongodb://e2425-wads-l4acg6:hoch22uc@mongodb.csbihub.id:27017/e2425-wads-l4acg6";

mongoose.connect(uri)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("💥 MongoDB connection error:", err);
    process.exit(1);
  });