const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 1. Middleware
app.use(express.json());
app.use(cors()); // Allows your Website and Mobile app to connect

// 2. Database Connection
// This uses the "Key" you created in the Render Environment tab
const mongoURI = process.env.MONGO_URI; 

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// 3. User Schema & Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  history: [
    {
      id: String,
      image: String,
      date: String,
      title: String
    }
  ]
});

const User = mongoose.model('User', userSchema);

// 4. Routes

// Health Check (To see if server is alive in browser)
app.get('/', (req, res) => {
  res.send('Server is alive and healthy on Render!');
});

// Login / Register Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      // Create new user if they don't exist
      user = new User({ email, password, history: [] });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
});

// Save Plant Route
app.post('/save-plant', async (req, res) => {
  const { email, id, image, date, title } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $push: { history: { $each: [{ id, image, date, title }], $position: 0 } } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to save plant" });
  }
});

// 5. Start Server
// Use process.env.PORT for Render, or 10000 for local testing
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server flawlessly running on port ${PORT}`);
});