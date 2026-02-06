
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

// --- স্কিমা সমূহ ---
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
  file: String,
  createdAt: { type: Date, default: Date.now }
});

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: String,
  date: String,
  dueDate: String,
  billFrom: String,
  billTo: String,
  items: Array,
  subtotal: Number,
  taxRate: Number,
  taxAmount: Number,
  total: Number,
  notes: String,
  status: { type: String, default: 'unpaid' },
  createdAt: { type: Date, default: Date.now }
});

const QuickLinkSchema = new mongoose.Schema({
  title: String,
  url: String,
  description: String
});

// মডেল এক্সেস ফাংশন (Serverless context এ নিরাপদ)
const getModels = () => {
  return {
    User: mongoose.models.User || mongoose.model('User', UserSchema),
    Task: mongoose.models.Task || mongoose.model('Task', TaskSchema),
    Client: mongoose.models.Client || mongoose.model('Client', ClientSchema),
    Invoice: mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema),
    QuickLink: mongoose.models.QuickLink || mongoose.model('QuickLink', QuickLinkSchema)
  };
};

// ডাটাবেজ কানেকশন ক্যাশ
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is missing. Please add it to Vercel Environment Variables.');
  }

  try {
    // কানেকশন অপশন
    const opts = {
      serverSelectionTimeoutMS: 15000,
      bufferCommands: false,
    };

    const db = await mongoose.connect(MONGO_URI, opts);
    cachedDb = db;
    console.log('✅ MongoDB Connected Successfully');

    // অ্যাডমিন ইউজার চেক ও তৈরি (Seed)
    const { User } = getModels();
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
      console.log('✅ Default Admin User Created');
    }

    return db;
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
    throw error;
  }
}

// মিডলওয়্যার
const dbCheck = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ 
      msg: 'Database error', 
      detail: error.message,
      hint: 'Check if MONGO_URI is correct and IP 0.0.0.0/0 is whitelisted in MongoDB Atlas.'
    });
  }
};

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Token is invalid' });
  }
};

// --- API Endpoints ---

app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', detail: e.message });
  }
});

app.post('/api/auth/login', dbCheck, async (req, res) => {
  try {
    const { User } = getModels();
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'ইউজার খুঁজে পাওয়া যায়নি!' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'ভুল পাসওয়ার্ড!' });
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (e) {
    res.status(500).json({ msg: 'সার্ভার এরর', error: e.message });
  }
});

app.post('/api/auth/register', dbCheck, async (req, res) => {
  try {
    const { User } = getModels();
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'এই ইমেইল দিয়ে অলরেডি একাউন্ট আছে!' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = new User({ name, email, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (e) {
    res.status(500).json({ msg: 'রেজিস্ট্রেশন এরর', error: e.message });
  }
});

// টাস্ক এপিআই
app.get('/api/tasks', auth, dbCheck, async (req, res) => {
  try {
    const { Task } = getModels();
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.post('/api/tasks', auth, dbCheck, async (req, res) => {
  try {
    const { Task } = getModels();
    const task = new Task({ ...req.body, createdBy: req.user.id });
    await task.save();
    res.json(task);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// কুইক লিঙ্ক এপিআই
app.get('/api/quicklinks', auth, dbCheck, async (req, res) => {
  try {
    const { QuickLink } = getModels();
    const links = await QuickLink.find();
    res.json(links);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// ইনভয়েস এপিআই
app.get('/api/invoices', auth, dbCheck, async (req, res) => {
  try {
    const { Invoice } = getModels();
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// ইউজার এপিআই
app.get('/api/users', auth, dbCheck, async (req, res) => {
  try {
    const { User } = getModels();
    const users = await User.find({}, 'name email role status');
    res.json(users);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

module.exports = app;
