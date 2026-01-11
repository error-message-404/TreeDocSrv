const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json({ limit: "10mb" })); // Allows sending photos
app.use(cors());

// Connection String (Replace <db_password> with your actual password)
const MONGO_URI =
  "mongodb+srv://wapex999_db_user:TreeDoc2026@cluster0.hn9apz8.mongodb.net/DemoDB";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ Connection Error:", err));

// Simple Schema: No encryption, just data
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  history: Array,
});

const User = mongoose.model("User", UserSchema);

app.get("/", (req, res) => {
  res.send("Server is alive and healthy!");
});

// AUTH: If user doesn't exist, create them. If they do, log them in.
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ email, password, history: [] });
    await user.save();
  }
  res.json(user);
});

// SAVE PHOTO: Pushes a new photo to the history array
app.post("/save-plant", async (req, res) => {
  const { email, image, date, title } = req.body;
  const user = await User.findOneAndUpdate(
    { email },
    { $push: { history: { image, date, title } } },
    { new: true }
  );
  res.json(user.history);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server flawlessly running on port ${PORT}`);
});
