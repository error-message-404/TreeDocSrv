require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware - DUHET limit 10mb për imazhet Base64
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// 2. MongoDB connection
mongoose
  .connect(process.env.MONGO_USR)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB error:", err));

// 3. User schema - Duhet të përfshijë 'history'
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  history: [
    {
      id: String,
      image: String, // Stringu i gjatë i imazhit
      date: String,
      title: String
    }
  ]
});

const User = mongoose.model("User", userSchema);

// 4. Routes
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password, history: [] });
    await user.save();
    res.status(201).json({ message: "User created" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { username, email, password } = req.body;
  const targetUser = username || email; // Pranon të dyja

  try {
    const user = await User.findOne({ username: targetUser });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Login me password ose dummy refresh
    if (password === "dummy" || user.password === password) {
      res.json({ message: "Success", history: user.history || [] });
    } else {
      res.status(401).json({ error: "Wrong password" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));