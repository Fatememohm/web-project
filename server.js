const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware پایه
app.use(express.static(__dirname));

// پروکسی API
app.use('/api', createProxyMiddleware({
  target: 'https://edu-api.havirkesht.ir',
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  onProxyReq: (proxyReq, req, res) => {
    // اضافه کردن هدرهای لازم
    proxyReq.setHeader('Accept', 'application/json');
    proxyReq.setHeader('Content-Type', 'application/json');
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Proxy error occurred' });
  }
}));

// Routeهای اصلی - با نام صحیح فایل‌ها
app.get('/', (req, res) => {
  // اگر Login.html با L بزرگ است
  res.sendFile(path.join(__dirname, 'Login.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Login.html'));
});

// Health check برای لیارا
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    app: 'havirkesht-frontend',
    node: process.version
  });
});

// هندل 404
app.use('*', (req, res) => {
  // اگر مسیر ناشناخته بود، به لاگین هدایت کن
  res.redirect('/');
});

// هندل خطاها
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📡 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`🌐 App: http://0.0.0.0:${PORT}`);
});