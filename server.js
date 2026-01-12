const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// 1. Middleware
// Rritja e limitit është hapi kyç për imazhet nga Mobile
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// 2. Database Connection
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
      image: String, // Stringu Base64 i imazhit
      date: String,
      title: String
    }
  ]
});

const User = mongoose.model('User', userSchema);

// 4. Routes

app.get('/', (req, res) => {
  res.send('Server is alive and healthy on Render!');
});

// Login / Register Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password, history: [] });
      await user.save();
    }
    // Kthejmë përdoruesin bashkë me historikun
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
});

// Save Plant Route (Përdoret nga Mobile)
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});