
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createHttpServer } from 'http';
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
import { createServer as createViteServer } from 'vite';
import { getSeedData } from './src/seedData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

const app = express();
const httpServer = createHttpServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  console.log('[SOCKET] Client connected:', socket.id);

  socket.on('join_negotiation', (negotiationId) => {
    socket.join(negotiationId);
    console.log(`[SOCKET] Client ${socket.id} joined room: ${negotiationId}`);
  });

  socket.on('send_message', (data) => {
    // data: { negotiationId, message }
    io.to(data.negotiationId).emit('new_message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('[SOCKET] Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'YDTECH_ULTIMATE_SECRET_2025_CORE';

// RAZORPAY CONFIG
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

// STORAGE SETUP
const UPLOADS_BASE = path.join(__dirname, 'uploads');
const SUB_DIRS = ['users', 'products', 'services', 'leads', 'company', 'logos', 'quotes'];
SUB_DIRS.forEach(dir => {
  const p = path.join(UPLOADS_BASE, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_BASE));

// --- DATABASE FALLBACK (JSON) ---
const DB_FILE = path.join(__dirname, 'db.json');
let db: any = {
  users: [],
  leads: [],
  quotes: [],
  negotiations: [],
  products: [],
  payments: []
};

if (fs.existsSync(DB_FILE)) {
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf8');
    // Only parse if content looks like JSON
    if (fileContent.trim().startsWith('{')) {
      db = JSON.parse(fileContent);
    } else {
      console.warn('[DB] Warning: db.json content invalid, using empty default.');
    }
  } catch (e) {
    console.error('[DB] Error loading DB file (ignoring):', e);
  }
}

const saveDb = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

const seedDatabase = async () => {
  const seed = await getSeedData();

  if (pool) {
    try {
      // Seed Users if empty
      const [uRows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
      if (uRows[0].count === 0) {
        console.log('[SEED] Users table empty, seeding initial users...');
        for (const u of seed.users) {
          await pool.execute(
            `INSERT INTO users (id, name, email, phone, password, roles, status, is_approved, profile_image, company_name, gst_number, city, pincode, joined_date, auth_provider, permissions) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.id, u.name, u.email, u.phone, u.password, JSON.stringify(u.roles), u.status, u.is_approved ? 1 : 0, u.profile_image, u.company_name, u.gst_number, u.city, u.pincode, u.joined_date, u.auth_provider, JSON.stringify(u.permissions || [])]
          );
        }
      }

      // Seed Leads if empty
      const [lRows]: any = await pool.query('SELECT COUNT(*) as count FROM leads');
      if (lRows[0].count === 0) {
        console.log('[SEED] Leads table empty, seeding initial leads...');
        for (const l of seed.leads) {
          await pool.execute(
            `INSERT INTO leads (id, buyerId, buyerName, requirementName, description, budget, category, leadImage, quantity, status, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [l.id, l.buyerId, l.buyerName, l.requirementName, l.description, l.budget, l.category, l.leadImage, l.quantity, l.status, l.createdAt]
          );
        }
      }

      // Seed Products if empty
      const [pRows]: any = await pool.query('SELECT COUNT(*) as count FROM products');
      if (pRows[0].count === 0) {
        console.log('[SEED] Products table empty, seeding initial products...');
        for (const p of seed.products) {
          await pool.execute(
            `INSERT INTO products (id, name, companyName, brand, modelNumber, price, category, gstPercent, stock, specifications, description, availabilityType, availabilityDays, vendorId, vendorName, productImage, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.name, p.companyName, p.brand, p.modelNumber, p.price, p.category, p.gstPercent, p.stock, p.specifications, p.description, p.availabilityType, p.availabilityDays, p.vendorId, p.vendorName, p.productImage, p.status]
          );
        }
      }

      // Always ensure Super Admin is synced
      const admin = seed.users[0];
      const [existingAdmin]: any = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [admin.email]);
      if (existingAdmin.length === 0) {
        console.log(`[SEED] Super Admin (${admin.email}) not found, creating...`);
        await pool.execute(
          `INSERT INTO users (id, name, email, phone, password, roles, status, is_approved, profile_image, company_name, gst_number, city, pincode, joined_date, auth_provider, permissions) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [admin.id, admin.name, admin.email, admin.phone, admin.password, JSON.stringify(admin.roles), admin.status, admin.is_approved ? 1 : 0, admin.profile_image, admin.company_name, admin.gst_number, admin.city, admin.pincode, admin.joined_date, admin.auth_provider, JSON.stringify(admin.permissions || [])]
        );
      } else {
        await pool.execute(
          `UPDATE users SET password = ?, roles = ?, permissions = ? WHERE LOWER(email) = LOWER(?)`,
          [admin.password, JSON.stringify(admin.roles), JSON.stringify(admin.permissions || []), admin.email]
        );
        console.log(`[SEED] Super Admin (${admin.email}) credentials synchronized.`);
      }
    } catch (e) {
      console.error('[SEED] Failed to seed MySQL database:', e);
    }
  } else {
    // JSON Seeding
    try {
      if (db.users.length === 0) {
        console.log('[SEED] JSON DB empty, seeding initial data...');
        db.users = seed.users;
        db.leads = seed.leads;
        db.products = seed.products;
        saveDb();
        console.log('[SEED] JSON Seeding complete.');
      } else {
        // Ensure Super Admin exists in JSON
        const admin = seed.users[0];
        const existingIdx = db.users.findIndex((u: any) => u.email === admin.email);
        if (existingIdx === -1) {
          db.users.push(admin);
          saveDb();
          console.log('[SEED] JSON Super Admin created.');
        } else {
          db.users[existingIdx] = { ...db.users[existingIdx], ...admin };
          saveDb();
          console.log('[SEED] JSON Super Admin updated.');
        }
      }
    } catch (e) {
      console.error('[SEED] Failed to seed JSON database:', e);
    }
  }
};

// XAMPP Connection Attempt
let pool: any = null;
const connectDb = async () => {
  const dbConfig: any = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ydtechpro',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 20,
    connectTimeout: 10000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };

  try {
    // First connect without database to ensure it exists
    const tempPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 1,
      connectTimeout: 5000
    });
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempPool.end();

    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    console.log('[DB] Connected to MySQL (XAMPP/Hostinger Mode)');

    // Initialize Database Schema
    await initSchema();
  } catch (e: any) {
    console.warn('[DB] MySQL Connection Failed:', e.message);
    if (dbConfig.host !== 'localhost' && dbConfig.host !== '127.0.0.1') {
      console.warn(`[DB] Note: You are trying to connect to a remote host (${dbConfig.host}). If this is a local IP, the AI Studio preview environment cannot reach it directly.`);
    }
    console.warn('[DB] Falling back to JSON persistence for preview. Ensure XAMPP MySQL is running for local use.');
    pool = null; 
  }
};

// --- DATABASE INITIALIZATION ---
const initSchema = async () => {
  if (!pool) return;
  try {
    console.log('[DB] Verifying Schema...');
    
    // Users Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        password VARCHAR(255),
        roles LONGTEXT,
        status VARCHAR(50) DEFAULT 'pending',
        is_approved BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        payment_exempt BOOLEAN DEFAULT FALSE,
        profile_image LONGTEXT,
        company_name VARCHAR(255),
        gst_number VARCHAR(50),
        city VARCHAR(100),
        pincode VARCHAR(20),
        joined_date DATETIME,
        auth_provider VARCHAR(50) DEFAULT 'email',
        google_id VARCHAR(255),
        permissions LONGTEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure password column is long enough
    try {
      await pool.execute('ALTER TABLE users MODIFY COLUMN password VARCHAR(255)');
    } catch (e) { /* ignore if already set */ }

    // Add missing columns if they don't exist (for existing databases)
    const userColumns = [
      { name: 'permissions', type: 'LONGTEXT' },
      { name: 'is_approved', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_locked', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'payment_exempt', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'auth_provider', type: "VARCHAR(50) DEFAULT 'email'" },
      { name: 'google_id', type: 'VARCHAR(255)' },
      { name: 'profile_image', type: 'LONGTEXT' },
      { name: 'company_name', type: 'VARCHAR(255)' },
      { name: 'gst_number', type: 'VARCHAR(50)' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'pincode', type: 'VARCHAR(20)' },
      { name: 'joined_date', type: 'DATETIME' }
    ];

    for (const col of userColumns) {
      try {
        await pool.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[DB] Added column ${col.name} to users table.`);
      } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
          console.log(`[DB] Note: ${col.name} column check:`, e.message);
        }
      }
    }

    // Leads Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(50) PRIMARY KEY,
        buyerId VARCHAR(50),
        buyerName VARCHAR(255),
        requirementName VARCHAR(255),
        description TEXT,
        budget DECIMAL(15, 2),
        category VARCHAR(100),
        leadImage LONGTEXT,
        quantity INT DEFAULT 1,
        status VARCHAR(50) DEFAULT 'OPEN',
        createdAt DATETIME,
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        city VARCHAR(100)
      )
    `);

    // Products Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        companyName VARCHAR(255),
        brand VARCHAR(100),
        modelNumber VARCHAR(100),
        price DECIMAL(15, 2),
        category VARCHAR(100),
        gstPercent DECIMAL(5, 2) DEFAULT 18,
        stock INT DEFAULT 0,
        specifications TEXT,
        description TEXT,
        availabilityType VARCHAR(50),
        availabilityDays INT DEFAULT 0,
        vendorId VARCHAR(50),
        vendorName VARCHAR(255),
        productImage LONGTEXT,
        status VARCHAR(50) DEFAULT 'active'
      )
    `);

    // Quotes Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        id VARCHAR(50) PRIMARY KEY,
        vendorId VARCHAR(50),
        vendorName VARCHAR(255),
        leadId VARCHAR(50),
        price DECIMAL(15, 2),
        gstAmount DECIMAL(15, 2) DEFAULT 0,
        discount DECIMAL(15, 2) DEFAULT 0,
        visitCharges DECIMAL(15, 2) DEFAULT 0,
        installationCost DECIMAL(15, 2) DEFAULT 0,
        finalPrice DECIMAL(15, 2),
        terms TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        createdAt DATETIME
      )
    `);

    // Negotiations Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS negotiations (
        id VARCHAR(50) PRIMARY KEY,
        entityId VARCHAR(50),
        entityType VARCHAR(50),
        buyerId VARCHAR(50),
        sellerId VARCHAR(50),
        currentOffer DECIMAL(15, 2),
        status VARCHAR(50),
        messages LONGTEXT,
        createdAt DATETIME
      )
    `);

    // Audit Logs Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(50),
        userName VARCHAR(255),
        action VARCHAR(100),
        details TEXT,
        ipAddress VARCHAR(50),
        timestamp DATETIME
      )
    `);

    console.log('[DB] Schema Verified.');
  } catch (e: any) {
    console.error('[DB] Schema Initialization Failed:', e.message);
    // Don't exit, just log the error
  }
};

// --- MIDDLEWARE ---
const authenticate = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Identity verification required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) { res.status(401).json({ error: 'Access token expired or invalid.' }); }
};

const authorize = (permission: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userPerms = req.user.perms || [];
    if (userPerms.includes(permission) || userPerms.includes('admin:*')) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
  };
};

const logAudit = async (userId: string, userName: string, action: string, details: string, req: Request) => {
  const log = {
    id: `AUDIT-${uuidv4().slice(0, 8)}`,
    userId,
    userName,
    action,
    details,
    ipAddress: req.ip,
    timestamp: new Date().toISOString()
  };
  
  if (pool) {
    await pool.execute(
      'INSERT INTO audit_logs (id, userId, userName, action, details, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [log.id, log.userId, log.userName, log.action, log.details, log.ipAddress, log.timestamp]
    );
  } else {
    if (!db.audit_logs) db.audit_logs = [];
    db.audit_logs.push(log);
    saveDb();
  }
};

const getPermissionsForRoles = (roles: string[]) => {
  const permMap: Record<string, string[]> = {
    'BUYER': ['leads:create', 'leads:read', 'negotiations:manage', 'listings:read', 'profile:edit', 'cart:manage'],
    'SELLER': ['products:manage', 'leads:read', 'negotiations:manage', 'listings:read', 'profile:edit'],
    'ADMIN': ['admin:*', 'leads:read', 'products:read', 'negotiations:manage', 'listings:read', 'admin:dashboard:access'],
    'SUPER_ADMIN': ['admin:*']
  };
  
  const perms = new Set<string>();
  roles.forEach(role => {
    (permMap[role] || []).forEach(p => perms.add(p));
  });
  return Array.from(perms);
};

// --- HELPERS ---
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatUser(u: any) {
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

function saveBase64Image(base64Data: string, subDir: string) {
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
  } catch (err) { 
    console.error(`[IMAGE] Failed to save image in ${subDir}:`, err);
    return base64Data; 
  }
}

// --- DEV UTILS ---
app.get('/api/v1/dev/reset-db', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }
  
  try {
    if (pool) {
      console.log('[DEV] Wiping MySQL database for reset...');
      await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
      await pool.execute('DROP TABLE IF EXISTS audit_logs');
      await pool.execute('DROP TABLE IF EXISTS payments');
      await pool.execute('DROP TABLE IF EXISTS products');
      await pool.execute('DROP TABLE IF EXISTS negotiations');
      await pool.execute('DROP TABLE IF EXISTS quotes');
      await pool.execute('DROP TABLE IF EXISTS leads');
      await pool.execute('DROP TABLE IF EXISTS users');
      await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
      await initSchema();
      await seedDatabase();
    } else {
      console.log('[DEV] Wiping JSON database for reset...');
      db = { users: [], leads: [], quotes: [], negotiations: [], products: [], payments: [], audit_logs: [] };
      saveDb();
      await seedDatabase();
    }
    res.json({ status: 'success', message: 'Database has been completely wiped and re-seeded.' });
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// --- AUTH ---
app.get('/api/v1/auth/check-email', async (req: Request, res: Response) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  try {
    let exists = false;
    if (pool) {
      const [rows]: any = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      exists = rows.length > 0;
    } else {
      exists = db.users.some((u: any) => u.email.toLowerCase() === (email as string).toLowerCase());
    }
    res.json({ exists });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
  const user = req.body;
  try {
    if (pool) {
      const [existing]: any = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [user.email]);
      if (existing.length > 0) return res.status(400).json({ status: 'error', message: 'Identity already exists.' });
    } else {
      const existing = db.users.find((u: any) => u.email.toLowerCase() === user.email.toLowerCase());
      if (existing) return res.status(400).json({ status: 'error', message: 'Identity already exists.' });
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userId = `USR-${uuidv4().slice(0, 8)}`;
    const profileImage = saveBase64Image(user.profileImage, 'users');
    
    if (pool) {
      await pool.execute(
        `INSERT INTO users (id, name, email, phone, password, roles, status, is_approved, profile_image, company_name, gst_number, city, pincode, joined_date, auth_provider) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, user.name, user.email, user.phone, hashedPassword, JSON.stringify(user.roles || ['BUYER']), 'pending', 0, profileImage, user.companyName, user.gstNumber, user.city, user.pincode, new Date(), 'email']
      );
    } else {
      db.users.push({
        id: userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: hashedPassword,
        roles: user.roles || ['BUYER'],
        status: 'pending',
        is_approved: 0,
        profile_image: profileImage,
        company_name: user.companyName,
        gst_number: user.gstNumber,
        city: user.city,
        pincode: user.pincode,
        joined_date: new Date().toISOString(),
        auth_provider: 'email'
      });
      saveDb();
    }
    res.json({ status: 'success', userId });
  } catch (err: any) { 
    console.error('[AUTH] Registration failed:', err);
    res.status(500).json({ status: 'error', message: err.message }); 
  }
});

app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    let user;
    if (pool) {
      console.log(`[AUTH] Attempting login for: ${email}`);
      const [rows]: any = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (rows.length === 0) {
        console.warn(`[AUTH] Login failed: User ${email} not found in MySQL.`);
        return res.status(404).json({ status: 'error', message: 'Identity not found.' });
      }
      user = rows[0];
    } else {
      console.log(`[AUTH] Attempting JSON login for: ${email}`);
      user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        console.warn(`[AUTH] Login failed: User ${email} not found in JSON.`);
        return res.status(404).json({ status: 'error', message: 'Identity not found.' });
      }
    }
    
    if (user.is_locked) {
      console.warn(`[AUTH] Login blocked: Account ${email} is locked.`);
      return res.status(403).json({ status: 'error', message: 'Account suspended.' });
    }
    
    // Check if user has a password (might be google-only)
    if (!user.password && user.auth_provider === 'google') {
      return res.status(401).json({ status: 'error', message: 'This account uses Google Login. Please use the Google button.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[AUTH] Login failed: Invalid password for ${email}`);
      // Check if the password in DB is actually hashed
      if (!user.password.startsWith('$2')) {
        console.error(`[AUTH] CRITICAL: Password for ${email} in database is NOT hashed! This will cause login failure.`);
        return res.status(500).json({ status: 'error', message: 'Database integrity error: Plaintext password detected. Please reset database.' });
      }
      return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
    }

    const formatted = formatUser(user);
    const perms = getPermissionsForRoles(formatted.roles);
    const token = jwt.sign({ id: user.id, roles: formatted.roles, perms }, JWT_SECRET, { expiresIn: '7d' });
    
    await logAudit(user.id, user.name, 'LOGIN', 'Standard login successful', req);
    io.emit('live_login', { userName: user.name, timestamp: new Date().toISOString(), type: 'email' });
    
    res.json({ status: 'success', token, user: { ...formatted, permissions: perms } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    let user;
    if (pool) {
      const [rows]: any = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      user = rows[0];
    } else {
      user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) return res.status(404).json({ status: 'error', message: 'Identity not found.' });

    // In a real app, send an email. Here we'll just return a success message.
    // For development, we'll allow a "reset" by providing a token or just a message.
    console.log(`[AUTH] Password reset requested for: ${email}`);
    
    res.json({ status: 'success', message: 'Password reset protocol initiated. Check your logs or contact support.' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- GOOGLE OAUTH ---
app.get('/api/v1/auth/google/url', (req, res) => {
  const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const redirectUri = `${baseUrl}/api/v1/auth/google/callback`;
  
  console.log(`[AUTH] Generating Google Auth URL with Redirect URI: ${redirectUri}`);
  
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    redirect_uri: redirectUri
  });
  res.json({ url });
});

app.get('/api/v1/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const redirectUri = `${baseUrl}/api/v1/auth/google/callback`;
  
  try {
    const { tokens } = await googleClient.getToken({
      code: code as string,
      redirect_uri: redirectUri
    });
    googleClient.setCredentials(tokens);

    const userInfo: any = await googleClient.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const { email, name, picture, sub: googleId } = userInfo.data;

    let user;
    if (pool) {
      const [rows]: any = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      user = rows[0];
    } else {
      user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      // Create new user
      const userId = `USR-${uuidv4().slice(0, 8)}`;
      const roles = ['BUYER'];
      if (pool) {
        await pool.execute(
          `INSERT INTO users (id, name, email, roles, status, is_approved, profile_image, auth_provider, google_id, joined_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, name, email, JSON.stringify(roles), 'active', 1, picture, 'google', googleId, new Date()]
        );
        const [newRows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        user = newRows[0];
      } else {
        user = {
          id: userId,
          name,
          email,
          roles,
          status: 'active',
          is_approved: 1,
          profile_image: picture,
          auth_provider: 'google',
          google_id: googleId,
          joined_date: new Date().toISOString()
        };
        db.users.push(user);
        saveDb();
      }
    } else {
      // Update existing user to link google
      if (pool) {
        await pool.execute('UPDATE users SET auth_provider = ?, google_id = ? WHERE id = ?', ['google', googleId, user.id]);
        const [updatedRows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
        user = updatedRows[0];
      } else {
        user.auth_provider = 'google';
        user.google_id = googleId;
        saveDb();
      }
    }

    const formatted = formatUser(user);
    const perms = getPermissionsForRoles(formatted.roles);
    const token = jwt.sign({ id: user.id, roles: formatted.roles, perms }, JWT_SECRET, { expiresIn: '7d' });

    await logAudit(user.id, user.name, 'LOGIN_GOOGLE', 'Google OAuth login successful', req);
    io.emit('live_login', { userName: user.name, timestamp: new Date().toISOString(), type: 'google' });

    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                token: '${token}', 
                user: ${JSON.stringify({ ...formatted, permissions: perms })} 
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    res.status(500).send('Authentication failed.');
  }
});

app.get('/api/v1/auth/me', authenticate, async (req: any, res: Response) => {
  try {
    let user;
    if (pool) {
      const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
      user = rows[0];
    } else {
      user = db.users.find((u: any) => u.id === req.user.id);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUser(user) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- DATABASE RESET (ADMIN ONLY) ---
app.post('/api/v1/admin/reset-db', authenticate, authorize('admin:*'), async (req: Request, res: Response) => {
  if (!pool) return res.status(400).json({ error: 'MySQL not connected' });
  try {
    console.log('[DB] Resetting database as requested by admin...');
    const tables = ['audit_logs', 'negotiations', 'quotes', 'products', 'leads', 'users'];
    for (const table of tables) {
      await pool.execute(`DROP TABLE IF EXISTS ${table}`);
    }
    await initSchema();
    await seedDatabase();
    res.json({ status: 'success', message: 'Database recreated and seeded successfully.' });
  } catch (err: any) {
    console.error('[DB] Reset failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN & GOVERNANCE ---
app.get('/api/v1/admin/users', authenticate, async (req: Request, res: Response) => {
  if (pool) {
    const [rows]: any = await pool.query('SELECT * FROM users ORDER BY joined_date DESC');
    res.json({ users: rows.map(formatUser) });
  } else {
    res.json({ users: db.users.map(formatUser) });
  }
});

app.patch('/api/v1/admin/users/:userId', authenticate, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const updates = req.body;
  try {
    if (pool) {
      const fields: string[] = [];
      const values: any[] = [];
      Object.keys(updates).forEach(key => {
        const dbKey = key === 'isApproved' ? 'is_approved' : key === 'isLocked' ? 'is_locked' : key;
        fields.push(`${dbKey} = ?`);
        values.push(typeof updates[key] === 'boolean' ? (updates[key] ? 1 : 0) : Array.isArray(updates[key]) ? JSON.stringify(updates[key]) : updates[key]);
      });
      values.push(userId);
      await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    } else {
      const index = db.users.findIndex((u: any) => u.id === userId);
      if (index !== -1) {
        Object.keys(updates).forEach(key => {
          const dbKey = key === 'isApproved' ? 'is_approved' : key === 'isLocked' ? 'is_locked' : key;
          db.users[index][dbKey] = updates[key];
        });
        saveDb();
      }
    }
    res.json({ status: 'success' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- LEADS & QUOTES ---
app.get('/api/v1/leads', async (req: Request, res: Response) => {
  const { lat, lng, radius } = req.query;
  try {
    let leads: any[] = [];
    if (pool) {
      if (lat && lng && radius) {
        const [rows]: any = await pool.query(
          `SELECT *, ST_Distance_Sphere(point(lng, lat), point(?, ?)) / 1000 AS distance 
           FROM leads 
           WHERE status != "HIDDEN"
           HAVING distance <= ? 
           ORDER BY distance ASC`, 
          [lng, lat, radius]
        );
        leads = rows;
      } else {
        const [rows]: any = await pool.query('SELECT * FROM leads WHERE status != "HIDDEN" ORDER BY createdAt DESC');
        leads = rows;
      }
    } else {
      leads = [...db.leads].filter((l: any) => l.status !== 'HIDDEN');
      if (lat && lng && radius) {
        leads = leads.filter(l => {
          if (!l.lat || !l.lng) return false;
          const dist = getDistance(Number(lat), Number(lng), Number(l.lat), Number(l.lng));
          return dist <= Number(radius);
        });
      }
      leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    res.json({ leads });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
});

app.post('/api/v1/leads', authenticate, async (req: any, res: Response) => {
  const lead = req.body;
  try {
    const leadId = `LEAD-${uuidv4().slice(0, 8)}`;
    const leadImage = saveBase64Image(lead.leadImage, 'leads');
    if (pool) {
      await pool.execute(
        `INSERT INTO leads (id, buyerId, buyerName, requirementName, description, budget, category, leadImage, quantity, status, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [leadId, req.user.id, lead.buyerName, lead.requirementName, lead.description, lead.budget, lead.category, leadImage, lead.quantity || 1, 'OPEN', new Date()]
      );
    } else {
      db.leads.push({
        id: leadId,
        buyerId: req.user.id,
        buyerName: lead.buyerName,
        requirementName: lead.requirementName,
        description: lead.description,
        budget: lead.budget,
        category: lead.category,
        leadImage: leadImage,
        quantity: lead.quantity || 1,
        status: 'OPEN',
        createdAt: new Date().toISOString()
      });
      saveDb();
    }
    res.json({ status: 'success', leadId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v1/products', async (req: Request, res: Response) => {
  try {
    let products: any[] = [];
    if (pool) {
      const [rows]: any = await pool.query('SELECT * FROM products WHERE status != "hidden" ORDER BY id DESC');
      products = rows;
    } else {
      products = db.products.filter((p: any) => p.status !== 'hidden');
    }
    res.json({ products });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); }
});

app.post('/api/v1/products', authenticate, async (req: any, res: Response) => {
  const product = req.body;
  try {
    const productId = product.id || `PROD-${uuidv4().slice(0, 8)}`;
    const productImage = saveBase64Image(product.productImage, 'products');
    if (pool) {
      await pool.execute(
        `INSERT INTO products (id, name, companyName, brand, modelNumber, price, category, gstPercent, stock, specifications, description, availabilityType, availabilityDays, vendorId, vendorName, productImage, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, product.name, product.companyName, product.brand, product.modelNumber, product.price, product.category, product.gstPercent || 18, product.stock || 0, product.specifications, product.description, product.availabilityType, product.availabilityDays || 0, req.user.id, product.vendorName, productImage, 'active']
      );
    } else {
      db.products.push({
        ...product,
        id: productId,
        vendorId: req.user.id,
        productImage,
        status: 'active'
      });
      saveDb();
    }
    res.json({ status: 'success', productId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/quotes', authenticate, async (req: any, res: Response) => {
  const quote = req.body;
  try {
    const quoteId = `QUO-${uuidv4().slice(0, 8)}`;
    if (pool) {
      await pool.execute(
        `INSERT INTO quotes (id, vendorId, vendorName, leadId, price, gstAmount, discount, visitCharges, installationCost, finalPrice, terms, status, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [quoteId, req.user.id, quote.vendorName, quote.leadId, quote.price, quote.gstAmount || 0, quote.discount || 0, quote.visitCharges || 0, quote.installationCost || 0, quote.finalPrice, quote.terms, 'PENDING', new Date()]
      );
    } else {
      db.quotes.push({
        id: quoteId,
        vendorId: req.user.id,
        vendorName: quote.vendorName,
        leadId: quote.leadId,
        price: quote.price,
        gstAmount: quote.gstAmount || 0,
        discount: quote.discount || 0,
        visitCharges: quote.visitCharges || 0,
        installationCost: quote.installationCost || 0,
        finalPrice: quote.finalPrice,
        terms: quote.terms,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
      saveDb();
    }
    res.json({ status: 'success', quoteId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v1/quotes/:leadId', authenticate, async (req: Request, res: Response) => {
  if (pool) {
    const [rows]: any = await pool.query('SELECT * FROM quotes WHERE leadId = ?', [req.params.leadId]);
    res.json({ quotes: rows });
  } else {
    res.json({ quotes: db.quotes.filter((q: any) => q.leadId === req.params.leadId) });
  }
});

// --- PAYMENTS & NEGOTIATIONS ---
app.post('/api/v1/negotiations/start', authenticate, async (req: Request, res: Response) => {
  const neg = req.body;
  try {
    const id = neg.id || `NEG-${uuidv4().slice(0, 8)}`;
    if (pool) {
      const [existing]: any = await pool.query('SELECT id FROM negotiations WHERE id = ?', [id]);
      if (existing.length > 0) {
        await pool.execute('UPDATE negotiations SET currentOffer = ?, status = ?, messages = ? WHERE id = ?', [neg.currentOffer, neg.status, JSON.stringify(neg.messages), id]);
      } else {
        await pool.execute(
          'INSERT INTO negotiations (id, entityId, entityType, buyerId, sellerId, currentOffer, status, messages, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, neg.entityId, neg.entityType, neg.buyerId, neg.sellerId, neg.currentOffer, 'STARTED', JSON.stringify(neg.messages || []), new Date()]
        );
      }
    } else {
      const index = db.negotiations.findIndex((n: any) => n.id === id);
      if (index !== -1) {
        db.negotiations[index].currentOffer = neg.currentOffer;
        db.negotiations[index].status = neg.status;
        db.negotiations[index].messages = neg.messages;
      } else {
        db.negotiations.push({
          id,
          entityId: neg.entityId,
          entityType: neg.entityType,
          buyerId: neg.buyerId,
          sellerId: neg.sellerId,
          currentOffer: neg.currentOffer,
          status: 'STARTED',
          messages: neg.messages || [],
          createdAt: new Date().toISOString()
        });
      }
      saveDb();
    }
    res.json({ status: 'success', id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v1/negotiations/:userId', authenticate, async (req: Request, res: Response) => {
  if (pool) {
    const [rows]: any = await pool.query('SELECT * FROM negotiations WHERE buyerId = ? OR sellerId = ?', [req.params.userId, req.params.userId]);
    res.json({ negotiations: rows.map((n: any) => ({ ...n, messages: JSON.parse(n.messages) })) });
  } else {
    res.json({ negotiations: db.negotiations.filter((n: any) => n.buyerId === req.params.userId || n.sellerId === req.params.userId) });
  }
});

// --- SYSTEM ---
app.get('/api/v1/system/health', async (req: Request, res: Response) => {
  try {
    if (pool) await pool.query('SELECT 1');
    res.json({ status: 'online', db: !!pool, timestamp: new Date() });
  } catch (e) { res.status(500).json({ status: 'offline', db: false }); }
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  await connectDb();
  await seedDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server: httpServer } // Share the same server for HMR to avoid port 24678
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // CONFIGURATION NOTE:
  // For AI Studio Preview: This MUST be '0.0.0.0' to be accessible via the proxy.
  // For Local XAMPP/Network: You can change this to 'localhost' or your specific IP '10.0.0.231'
  // via the HOST environment variable or by modifying the default below.
  const HOST = process.env.HOST || '0.0.0.0';
  const listenPort = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
  httpServer.listen(listenPort, HOST, () => {
    console.log(`[GOVERNANCE] Core active on http://${HOST}:${listenPort}`);
    console.log(`[NETWORK] To access via network, ensure HOST is set to '0.0.0.0' or your specific IP.`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Port ${PORT} is already in use.`);
      console.error(`💡 FIX: Another instance of the app is likely running. Please close other terminals or run:`);
      console.error(`   Windows (PowerShell): Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
      console.error(`   Mac/Linux: fuser -k ${PORT}/tcp\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
