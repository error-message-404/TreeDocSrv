require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// 1. Middleware
// KRITIKE: Rritja e limitit për të pranuar imazhet e gjata Base64 nga Mobile
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// 2. Database Connection
// Sigurohu që MONGO_URI është i saktë në Render -> Settings -> Environment
const mongoURI = process.env.MONGO_URI || process.env.MONGO_USR; 

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 3. User Schema & Model
// Përfshin fushën 'history' ashtu siç ruhet nga aplikacioni Mobile
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  history: [
    {
      id: String,
      image: String, // Këtu ruhet stringu Base64 i fotos
      date: String,
      title: String,
      result: String
    }
  ]
});

const User = mongoose.model('User', userSchema);

// 4. Routes

// Health Check
app.get('/', (req, res) => {
  res.send('Server is running perfectly!');
});

// Login / Register Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    
    if (!user) {
      // Krijo përdorues të ri nëse nuk ekziston (për herë të parë)
      user = new User({ email, password, history: [] });
      await user.save();
      return res.json(user);
    }

    // Lejo login-in normal ose refresh-in nga Web me fjalëkalimin "dummy"
    if (password === "dummy" || user.password === password) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Fjalëkalim i gabuar" });
    }
  } catch (err) {
    res.status(500).json({ error: "Gabim në server gjatë login-it" });
  }
});

// Save Plant Route (Përdoret kryesisht nga Mobile)
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
    res.status(500).json({ error: "Dështoi ruajtja e bimës" });
  }
});

// 5. Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});