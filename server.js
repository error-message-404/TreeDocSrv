require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Rritja e limiteve për të pranuar Base64 nga Mobile
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

mongoose.connect(process.env.MONGO_URI || process.env.MONGO_USR)
  .then(() => console.log('✅ Lidhura me MongoDB'))
  .catch(err => console.log('❌ Gabim lidhjeje:', err));

const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  history: Array
}));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password, history: [] });
      await user.save();
    }
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post('/save-plant', async (req, res) => {
  const { email, id, image, date, title } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $push: { history: { $each: [{ id, image, date, title }], $position: 0 } } },
      { new: true }
    );
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Dështoi ruajtja" }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveri hapur ne porten ${PORT}`));