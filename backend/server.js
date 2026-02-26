
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const PORT = 3001;
const JWT_SECRET = 'YDTECH_ULTIMATE_SECRET_2025_CORE';

// RAZORPAY CONFIG
const RAZORPAY_KEY_ID = 'rzp_test_SHXfrlOlUt0sKH';
const RAZORPAY_KEY_SECRET = 'MKrg2iucT1OwXj6ZBuCh3exo';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

// STORAGE SETUP
const UPLOADS_BASE = path.join(__dirname, '../uploads');
const SUB_DIRS = ['users', 'products', 'services', 'leads', 'company', 'logos', 'quotes'];
SUB_DIRS.forEach(dir => {
  const p = path.join(UPLOADS_BASE, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_BASE));

// XAMPP Connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ydtechpro',
  waitForConnections: true,
  connectionLimit: 20
});

// --- MIDDLEWARE ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Identity verification required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) { res.status(401).json({ error: 'Access token expired or invalid.' }); }
};

// --- HELPERS ---
function formatUser(u) {
  if (!u) return null;
  return {
    ...u,
    roles: typeof u.roles === 'string' ? JSON.parse(u.roles) : u.roles,
    isApproved: !!u.is_approved,
    isVerified: !!u.is_approved, 
    isLocked: !!u.is_locked,
    payment_exempt: !!u.payment_exempt
  };
}

function saveBase64Image(base64Data, subDir) {
  if (!base64Data || !base64Data.startsWith('data:image')) return base64Data;
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Data;
    const extension = matches[1].split('/')[1].split(';')[0] || 'png';
    const data = Buffer.from(matches[2], 'base64');
    const fileName = `${uuidv4()}.${extension}`;
    const relativePath = `/uploads/${subDir}/${fileName}`;
    fs.writeFileSync(path.join(UPLOADS_BASE, subDir, fileName), data);
    return relativePath;
  } catch (err) { return base64Data; }
}

// --- AUTH ---
app.post('/api/v1/auth/register', async (req, res) => {
  const user = req.body;
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [user.email]);
    if (existing.length > 0) return res.status(400).json({ status: 'error', message: 'Identity already exists.' });

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userId = `USR-${uuidv4().slice(0, 8)}`;
    
    await pool.execute(
      `INSERT INTO users (id, name, email, phone, password, roles, status, is_approved, profile_image, company_name, gst_number, city, pincode, joined_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, user.name, user.email, user.phone, hashedPassword, JSON.stringify(user.roles || ['BUYER']), 'pending', 0, saveBase64Image(user.profileImage, 'users'), user.companyName, user.gstNumber, user.city, user.pincode, new Date()]
    );
    res.json({ status: 'success', userId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Identity not found.' });
    
    const user = rows[0];
    if (user.is_locked) return res.status(403).json({ status: 'error', message: 'Account suspended.' });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });

    const formatted = formatUser(user);
    const token = jwt.sign({ id: user.id, roles: formatted.roles }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ status: 'success', token, user: formatted });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ADMIN & GOVERNANCE ---
app.get('/api/v1/admin/users', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users ORDER BY joined_date DESC');
  res.json({ users: rows.map(formatUser) });
});

app.patch('/api/v1/admin/users/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  try {
    const fields = [];
    const values = [];
    Object.keys(updates).forEach(key => {
      const dbKey = key === 'isApproved' ? 'is_approved' : key === 'isLocked' ? 'is_locked' : key;
      fields.push(`${dbKey} = ?`);
      values.push(typeof updates[key] === 'boolean' ? (updates[key] ? 1 : 0) : Array.isArray(updates[key]) ? JSON.stringify(updates[key]) : updates[key]);
    });
    values.push(userId);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ status: 'success' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- LEADS & QUOTES ---
app.get('/api/v1/leads', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM leads WHERE status != "HIDDEN" ORDER BY createdAt DESC');
  res.json({ leads: rows });
});

app.post('/api/v1/leads', authenticate, async (req, res) => {
  const lead = req.body;
  try {
    const leadId = `LEAD-${uuidv4().slice(0, 8)}`;
    await pool.execute(
      `INSERT INTO leads (id, buyerId, buyerName, requirementName, description, budget, category, leadImage, quantity, status, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [leadId, req.user.id, lead.buyerName, lead.requirementName, lead.description, lead.budget, lead.category, saveBase64Image(lead.leadImage, 'leads'), lead.quantity || 1, 'OPEN', new Date()]
    );
    res.json({ status: 'success', leadId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/quotes', authenticate, async (req, res) => {
  const quote = req.body;
  try {
    const quoteId = `QUO-${uuidv4().slice(0, 8)}`;
    await pool.execute(
      `INSERT INTO quotes (id, vendorId, vendorName, leadId, price, gstAmount, discount, visitCharges, installationCost, finalPrice, terms, status, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [quoteId, req.user.id, quote.vendorName, quote.leadId, quote.price, quote.gstAmount || 0, quote.discount || 0, quote.visitCharges || 0, quote.installationCost || 0, quote.finalPrice, quote.terms, 'PENDING', new Date()]
    );
    res.json({ status: 'success', quoteId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v1/quotes/:leadId', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM quotes WHERE leadId = ?', [req.params.leadId]);
  res.json({ quotes: rows });
});

// --- PAYMENTS & NEGOTIATIONS ---
app.post('/api/v1/negotiations/start', authenticate, async (req, res) => {
  const neg = req.body;
  try {
    const id = neg.id || `NEG-${uuidv4().slice(0, 8)}`;
    const [existing] = await pool.query('SELECT id FROM negotiations WHERE id = ?', [id]);
    if (existing.length > 0) {
      await pool.execute('UPDATE negotiations SET currentOffer = ?, status = ?, messages = ? WHERE id = ?', [neg.currentOffer, neg.status, JSON.stringify(neg.messages), id]);
    } else {
      await pool.execute(
        'INSERT INTO negotiations (id, entityId, entityType, buyerId, sellerId, currentOffer, status, messages, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, neg.entityId, neg.entityType, neg.buyerId, neg.sellerId, neg.currentOffer, 'STARTED', JSON.stringify(neg.messages || []), new Date()]
      );
    }
    res.json({ status: 'success', id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v1/negotiations/:userId', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM negotiations WHERE buyerId = ? OR sellerId = ?', [req.params.userId, req.params.userId]);
  res.json({ negotiations: rows.map(n => ({ ...n, messages: JSON.parse(n.messages) })) });
});

// --- SYSTEM ---
app.get('/api/v1/system/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'online', db: true, timestamp: new Date() });
  } catch (e) { res.status(500).json({ status: 'offline', db: false }); }
});

httpServer.listen(PORT, () => console.log(`[GOVERNANCE] Core active on Port ${PORT}`));
