const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Find Chrome for whatsapp-web.js
const possibleChrome = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
];
try {
  const chromeDir = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  if (fs.existsSync(chromeDir)) {
    const dirs = fs.readdirSync(chromeDir).sort().reverse();
    for (const d of dirs) {
      const candidate = path.join(chromeDir, d, 'chrome-win64', 'chrome.exe');
      if (fs.existsSync(candidate)) { possibleChrome.unshift(candidate); break; }
    }
  }
} catch {}
for (const p of possibleChrome) {
  if (p && fs.existsSync(p)) { process.env.PUPPETEER_EXECUTABLE_PATH = p; break; }
}

const cors = require('cors');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const eventRoutes = require('./routes/events');
const packageRoutes = require('./routes/packages');
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contacts');
const uploadRoutes = require('./routes/upload');
const slideRoutes = require('./routes/slides');
const settingsRoutes = require('./routes/settings');
const productCategoryRoutes = require('./routes/product-categories');
const productRoutes = require('./routes/products');
const productOrderRoutes = require('./routes/product-orders');
const whatsappRoutes = require('./routes/whatsapp');
const whatsapp = require('./services/whatsapp');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-orders', productOrderRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'fff', 'dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

whatsapp.init();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
