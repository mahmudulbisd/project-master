
/**
 * প্রজেক্ট মাস্টার ব্যাকএন্ড - Express.js + MongoDB
 * Vercel Serverless Optimized (api/index.js)
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// CORS কনফিগারেশন
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'pm_super_secret_123';
const MONGO_URI = process.env.MONGO_URI;

// স্কিমা ডিফিনিশন (ফাংশনের বাইরে একবারই হবে)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  status: { type: String, enum: ['pending', 'active'], default: 'active' }
});

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  deadline: String,
  priority: String,
  category: String,
  completed: { type: Boolean, default: false },
  createdBy: String,
  assignedTo: String,
  docLink: String,
  createdAt: { type: Date, default: Date.now }
});

const QuickLinkSchema = new mongoose.Schema({
  title: String,
  url: String,
  description: String
});

// মডেল তৈরি বা বিদ্যমান মডেল ব্যবহার
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const QuickLink = mongoose.models.QuickLink || mongoose.model('QuickLink', QuickLinkSchema);

// কানেকশন ক্যাশ
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI missing');
    throw new Error('Database URI missing');
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log('✅ MongoDB Connected');
    
    // সিড অ্যাডমিন ইউজার
    const adminEmail = 'mahmudul.bisd@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin#Mh2025!', salt);
      const newAdmin = new User({
        name: 'Mahmudul Hasan',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      await newAdmin.save();
    }
  } catch (e) {
    console.error('❌ DB Connection Error:', e.message);
    throw e;
  }
}

// মিডলওয়্যার: ডাটাবেজ চেক
const dbCheck = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(503).json({ 
      msg: 'Database connection failed. Check your MONGO_URI and IP whitelist in MongoDB Atlas.' 
    });
  }
};

// মিডলওয়্যার: অথেন্টিকেশন
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// --- API Endpoints ---

// হেলথ চেক
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', dbCheck, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({ name, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.post('/api/auth/login', dbCheck, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.get('/api/tasks', auth, dbCheck, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.post('/api/tasks', auth, dbCheck, async (req, res) => {
  try {
    const task = new Task({ ...req.body, createdBy: req.user.id });
    await task.save();
    res.json(task);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.get('/api/users', auth, dbCheck, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role status');
    res.json(users);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.get('/api/quicklinks', auth, dbCheck, async (req, res) => {
  try {
    const links = await QuickLink.find();
    res.json(links);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

module.exports = app;
