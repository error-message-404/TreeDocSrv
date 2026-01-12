require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// 1. Middleware - DUHET limit 10mb për imazhet Base64
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// 2. Database Connection
const mongoURI = process.env.MONGO_URI || process.env.MONGO_USR; 

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 3. User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  history: [
    {
      id: String,
      image: String, // Stringu i gjatë Base64
      date: String,
      title: String,
      result: String
    }
  ]
});

const User = mongoose.model('User', userSchema);

// 4. Routes
app.get('/', (req, res) => res.send('Server is alive!'));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password, history: [] });
      await user.save();
      return res.json(user);
    }
    // Lejon refresh-in me fjalëkalimin dummy
    if (password === "dummy" || user.password === password) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Password i gabuar" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/save-plant', async (req, res) => {
  const { email, id, image, date, title, result } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $push: { history: { $each: [{ id, image, date, title, result }], $position: 0 } } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Dështoi ruajtja" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Port: ${PORT}`));