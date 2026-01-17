require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const API_BASE = process.env.API_BASE || 'https://treedocsrv.onrender.com';

app.use(cors());
app.use(express.json());

// --- Serve uploaded images ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MongoDB setup ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// --- User schema ---
const User = mongoose.model(
  'User',
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    history: Array
  })
);

// --- Multer setup for file uploads ---
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ------------------ AUTH ROUTES ------------------

// --- REGISTER ---
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    const newUser = new User({ email, password, history: [] });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// --- LOGIN ---
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.password !== password) return res.status(401).json({ error: 'Incorrect password.' });

    // Map history image paths to full URLs
    const mappedHistory = (user.history || []).map(item => ({
      ...item,
      image: item.image ? `${API_BASE}${item.image}` : null
    }));

    res.json({ ...user.toObject(), history: mappedHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ------------------ PLANT / IMAGE ROUTE ------------------

// Upload plant image
app.post('/save-plant', upload.single('image'), async (req, res) => {
  try {
    const { email, id, date, title, result } = req.body;

    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

    const imagePath = `/uploads/${req.file.filename}`;

    const user = await User.findOneAndUpdate(
      { email },
      {
        $push: {
          history: {
            $each: [{ id, image: imagePath, date, title, result }],
            $position: 0
          }
        }
      },
      { new: true }
    );

    // Map images to full URLs before sending
    const mappedHistory = (user.history || []).map(item => ({
      ...item,
      image: item.image ? `${API_BASE}${item.image}` : null
    }));

    res.json({ ...user.toObject(), history: mappedHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during plant upload.' });
  }
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
