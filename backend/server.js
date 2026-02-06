
/**
 * প্রজেক্ট মাস্টার ব্যাকএন্ড - Express.js + MongoDB
 * Vercel Deployment Ready
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();

// CORS কনফিগারেশন
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'pm_super_secret_123';
const MONGO_URI = process.env.MONGO_URI;

// Disable mongoose command buffering to avoid hanging when disconnected
mongoose.set('bufferCommands', false);

if (!MONGO_URI) {
  console.error('❌ মঙ্গোডিবি ইউআরআই (MONGO_URI) এনভায়রনমেন্ট ভ্যারিয়েবলে সেট করা নেই!');
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

const User = mongoose.model('User', UserSchema);
const Task = mongoose.model('Task', TaskSchema);
const Invoice = mongoose.model('Invoice', InvoiceSchema);
const QuickLink = mongoose.model('QuickLink', QuickLinkSchema);

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
      console.log('✅ অ্যাডমিন ইউজার (Mahmudul Hasan) তৈরি হয়েছে।');
    }
  } catch (error) {
    console.error('❌ সিডিং এরর:', error);
  }
};

// MongoDB কানেকশন
let isConnected = false;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000 // 5 second timeout
  })
    .then(() => {
      console.log('✅ MongoDB কানেকশন সফল');
      isConnected = true;
      seedSpecificAdmin();
    })
    .catch(err => {
      console.error('❌ MongoDB কানেকশন এরর:', err);
      isConnected = false;
    });
}

// --- মিডলওয়্যার: ডেটাবেস চেক ---
const dbCheck = (req, res, next) => {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      msg: 'সার্ভার ডেটাবেসের সাথে কানেক্টেড নয়। দয়া করে MONGO_URI চেক করুন।' 
    });
  }
  next();
};

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'অথরাইজেশন টোকেন নেই' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'টোকেন সঠিক নয়' });
  }
};

// --- API Endpoints ---
app.post('/api/auth/register', dbCheck, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'ইউজার অলরেডি বিদ্যমান' });
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
    if (!user) return res.status(400).json({ msg: 'ইউজার পাওয়া যায়নি' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'ভুল পাসওয়ার্ড' });
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
    res.json({ msg: 'ডিলিট হয়েছে' });
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
    res.json({ msg: 'ডিলিট হয়েছে' });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

app.get('/api/users', auth, dbCheck, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role status');
    res.json(users);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

// প্রোডাকশনের জন্য অ্যাপ এক্সপোর্ট
module.exports = app;

// লোকাল হোস্টে রান করার জন্য
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 সার্ভার চলছে পোর্টে ${PORT}`));
}
