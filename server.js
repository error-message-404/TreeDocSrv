require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 📂 Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🗄️ MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// 👤 Schema
const User = mongoose.model(
  'User',
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, default: 'dummy' },
    history: Array
  })
);

// 🔐 Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, password, history: [] });
      await user.save();
    }

    if (password === 'dummy' || user.password === password) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Wrong password' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// 📸 Multer setup
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 🌱 Save plant (FILE UPLOAD)
app.post('/save-plant', upload.single('image'), async (req, res) => {
  try {
    const { email, id, date, title, result } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

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

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// 🚀 Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
