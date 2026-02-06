
/**
 * প্রজেক্ট মাস্টার ব্যাকএন্ড - Express.js + MongoDB
 * Vercel Serverless Optimized
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'pm_super_secret_123';
const MONGO_URI = process.env.MONGO_URI;

// কানেকশন ক্যাশ করার জন্য গ্লোবাল ভ্যারিয়েবল
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is missing in environment variables');
  }

  // Serverless optimization
  mongoose.set('bufferCommands', false);

  const opts = {
    serverSelectionTimeoutMS: 15000, // ১৫ সেকেন্ড সময় দেওয়া হলো
  };

  try {
    const db = await mongoose.connect(MONGO_URI, opts);
    cachedDb = db;
    console.log('✅ MongoDB Connected Successfully');
    
    // কানেক্ট হওয়ার পর একবারই সিডিং চেক করবে
    await seedSpecificAdmin();
    
    return db;
  } catch (e) {
    console.error('❌ MongoDB Connection Error:', e.message);
    throw e;
  }
}

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
  status: { type: String, default: 'unpaid' }
});

const QuickLinkSchema = new mongoose.Schema({
  title: String,
  url: String,
  description: String
});

// মডেলে যাতে পুনরায় ডিক্লেয়ারেশন এরর না আসে
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
const QuickLink = mongoose.models.QuickLink || mongoose.model('QuickLink', QuickLinkSchema);

// --- অটো-সিড অ্যাডমিন ইউজার ---
const seedSpecificAdmin = async () => {
  try {
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
      console.log('✅ Admin user created/seeded');
    }
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};

// --- মিডলওয়্যার ---
const dbCheck = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(503).json({ 
      msg: 'Database connection failed. Please check MONGO_URI and Network Access settings in MongoDB Atlas.' 
    });
  }
};

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No auth token found' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Invalid token' });
  }
};

// --- API Endpoints ---
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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

app.put('/api/tasks/:id', auth, dbCheck, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.delete('/api/tasks/:id', auth, dbCheck, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Task deleted' });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.get('/api/quicklinks', auth, dbCheck, async (req, res) => {
  try {
    const links = await QuickLink.find();
    res.json(links);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.post('/api/quicklinks', auth, dbCheck, async (req, res) => {
  try {
    const link = new QuickLink(req.body);
    await link.save();
    res.json(link);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.delete('/api/quicklinks/:id', auth, dbCheck, async (req, res) => {
  try {
    await QuickLink.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Link deleted' });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.get('/api/users', auth, dbCheck, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role status');
    res.json(users);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

module.exports = app;