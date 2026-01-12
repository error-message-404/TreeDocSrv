require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// 1. Konfigurimi i CORS - Lejon lidhjen nga Web dhe Mobile pa bllokime
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Middleware për Payload të madh (Base64 Imazhe)
// Rritja e limitit në 50mb siguron që asnjë foto e telefonit të mos bllokohet
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// 3. Database Connection
const mongoURI = process.env.MONGO_URI || process.env.MONGO_USR;

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 4. User Schema & Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  history: [
    {
      id: String,
      image: String, // Ruajmë stringun e plotë Base64
      date: String,
      title: String,
      result: String
    }
  ]
});

const User = mongoose.model('User', userSchema);

// 5. Routes

// Health Check
app.get('/', (req, res) => {
  res.send('TreeDoc API is running smoothly!');
});

// Login / Register Logic
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    let user = await User.findOne({ email });
    
    // Nëse përdoruesi nuk ekziston, e krijojmë (përputhet me login-in e parë)
    if (!user) {
      user = new User({ email, password, history: [] });
      await user.save();
      return res.json(user);
    }

    // Lejojmë login normal ose refresh me "dummy" fjalëkalim për Web
    if (password === "dummy" || user.password === password) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Password i gabuar" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server internal error" });
  }
});

// Save Plant - Përdoret nga Mobile për të shtuar analiza të reja
app.post('/save-plant', async (req, res) => {
  const { email, id, image, date, title, result } = req.body;
  
  if (!email || !image) {
    return res.status(400).json({ error: "Email and Image are required" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { 
        $push: { 
          history: { 
            $each: [{ id, image, date, title, result }], 
            $position: 0 // Shton analizën e fundit në fillim të listës
          } 
        } 
      },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ error: "Dështoi ruajtja e të dhënave" });
  }
});

// 6. Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server flawlessly running on port ${PORT}`);
});