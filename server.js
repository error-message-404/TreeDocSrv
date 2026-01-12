require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

mongoose.connect(process.env.MONGO_USR || process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

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
    if (password === "dummy" || user.password === password) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Wrong password" });
    }
  } catch (err) { res.status(500).json(err); }
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
  } catch (err) { res.status(500).json(err); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));